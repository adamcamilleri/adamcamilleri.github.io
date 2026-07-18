"""FastAPI application wiring the four layers together."""

from fastapi import FastAPI, HTTPException, Response, UploadFile
from pydantic import BaseModel, Field

from . import config
from .appdb import make_engine
from .catalog.dictionary import (
    DictionaryError,
    apply_dictionary,
    merge_preview,
    parse_dictionary,
)
from .catalog.store import CatalogStore
from .connectors import build_connector
from .connectors.base import ConnectorError, LegacyConnector
from .delivery.decode import describe_columns
from .delivery.export import export_csv, export_xlsx
from .history import HistoryStore
from .pipeline import llm
from .pipeline.generate import GenerationError, generate_sql
from .pipeline.validator import validate_sql

app = FastAPI(title="QueryDesk", version="1.0.0")

engine = make_engine(config.APP_DB_PATH)
store = CatalogStore(engine)
history = HistoryStore(engine)


def _connection_or_404(connection_id: int) -> dict:
    connection = store.get_connection(connection_id)
    if connection is None:
        raise HTTPException(404, f"Connection {connection_id} not found")
    return connection


def _connector_for(connection: dict) -> LegacyConnector:
    return build_connector(connection["kind"], connection["dsn"])


class ConnectionIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    kind: str = Field(pattern="^(sqlite|db2_odbc|sqlserver)$")
    dsn: str = Field(min_length=1, max_length=2000)


class TablePatch(BaseModel):
    description: str | None = Field(default=None, max_length=2000)


class ColumnPatch(BaseModel):
    description: str | None = Field(default=None, max_length=2000)
    codes: str | None = Field(default=None, max_length=2000)
    value_format: str | None = Field(default=None, max_length=20)
    share_samples: bool | None = None


class AskIn(BaseModel):
    connection_id: int
    request_text: str = Field(min_length=1, max_length=2000)


class QueryIn(BaseModel):
    connection_id: int
    sql: str = Field(min_length=1, max_length=20000)
    request_text: str = Field(default="", max_length=2000)
    explanation: str | None = Field(default=None, max_length=5000)


class ReportIn(BaseModel):
    connection_id: int
    name: str = Field(min_length=1, max_length=200)
    request_text: str = Field(min_length=1, max_length=2000)
    sql: str = Field(min_length=1, max_length=20000)
    explanation: str | None = Field(default=None, max_length=5000)


@app.get("/api/connections")
def list_connections():
    return store.list_connections()


@app.post("/api/connections", status_code=201)
def add_connection(body: ConnectionIn):
    if store.find_connection_by_name(body.name):
        raise HTTPException(409, f"A connection named '{body.name}' already exists")
    connector = build_connector(body.kind, body.dsn)
    try:
        connector.list_tables()
    except NotImplementedError as e:
        raise HTTPException(501, str(e))
    except ConnectorError as e:
        raise HTTPException(400, str(e))
    connection_id = store.add_connection(body.name, body.kind, connector.dsn)
    store.sync_introspection(connection_id, connector)
    return store.get_connection(connection_id)


@app.get("/api/catalog/{connection_id}")
def get_catalog(connection_id: int):
    _connection_or_404(connection_id)
    return {
        "tables": store.catalog_for_connection(connection_id),
        "join_paths": store.join_paths_for_connection(connection_id),
    }


@app.patch("/api/catalog/tables/{table_id}")
def patch_table(table_id: int, body: TablePatch):
    store.update_table(table_id, body.description)
    return {"ok": True}


@app.patch("/api/catalog/columns/{column_id}")
def patch_column(column_id: int, body: ColumnPatch):
    fields = body.model_dump(exclude_unset=True)
    if "share_samples" in fields and fields["share_samples"] is not None:
        fields["share_samples"] = 1 if fields["share_samples"] else 0
    store.update_column(column_id, fields)
    return {"ok": True}


async def _parse_upload(upload: UploadFile):
    data = await upload.read()
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(413, "Dictionary file is larger than 5 MB")
    try:
        return parse_dictionary(data, upload.filename or "")
    except DictionaryError as e:
        raise HTTPException(400, str(e))


@app.post("/api/catalog/{connection_id}/dictionary/preview")
async def dictionary_preview(connection_id: int, file: UploadFile):
    _connection_or_404(connection_id)
    doc = await _parse_upload(file)
    return merge_preview(store, connection_id, doc)


@app.post("/api/catalog/{connection_id}/dictionary/apply")
async def dictionary_apply(connection_id: int, file: UploadFile):
    _connection_or_404(connection_id)
    doc = await _parse_upload(file)
    return apply_dictionary(store, connection_id, doc)


@app.post("/api/ask")
def ask(body: AskIn):
    connection = _connection_or_404(body.connection_id)
    connector = _connector_for(connection)
    try:
        outcome = generate_sql(
            store, body.connection_id, connector, body.request_text
        )
    except llm.LLMUnavailable as e:
        raise HTTPException(503, str(e))
    except (llm.LLMError, GenerationError) as e:
        raise HTTPException(502, str(e))
    return outcome


@app.post("/api/query/validate")
def validate(body: QueryIn):
    _connection_or_404(body.connection_id)
    result = validate_sql(body.sql, store.schema_map(body.connection_id))
    return {
        "ok": result.ok,
        "sql": result.sql,
        "error": result.error,
        "notes": result.notes,
    }


def _run_validated(body: QueryIn):
    connection = _connection_or_404(body.connection_id)
    result = validate_sql(body.sql, store.schema_map(body.connection_id))
    if not result.ok:
        raise HTTPException(400, f"Validation failed: {result.error}")
    connector = _connector_for(connection)
    try:
        query_result = connector.execute_readonly(
            result.sql, row_limit=config.ROW_LIMIT, timeout_s=config.QUERY_TIMEOUT_S
        )
    except NotImplementedError as e:
        raise HTTPException(501, str(e))
    except ConnectorError as e:
        raise HTTPException(400, str(e))
    return result, query_result


@app.post("/api/query/run")
def run_query(body: QueryIn):
    try:
        result, query_result = _run_validated(body)
    except HTTPException as e:
        if body.request_text:
            history.record_run(
                body.connection_id, body.request_text, body.sql,
                body.explanation, "error", error=str(e.detail),
            )
        raise
    history.record_run(
        body.connection_id,
        body.request_text or "(manual SQL)",
        result.sql,
        body.explanation,
        "ok",
        row_count=len(query_result.rows),
        runtime_ms=query_result.runtime_ms,
    )
    return {
        "columns": describe_columns(store, body.connection_id, query_result.columns),
        "rows": [list(r) for r in query_result.rows],
        "row_count": len(query_result.rows),
        "runtime_ms": query_result.runtime_ms,
        "truncated": query_result.truncated,
        "sql": result.sql,
        "notes": result.notes,
    }


@app.post("/api/query/export/{fmt}")
def export_query(fmt: str, body: QueryIn):
    if fmt not in ("xlsx", "csv"):
        raise HTTPException(400, "Format must be xlsx or csv")
    result, query_result = _run_validated(body)
    columns = describe_columns(store, body.connection_id, query_result.columns)
    if fmt == "xlsx":
        payload = export_xlsx(query_result, columns)
        media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        payload = export_csv(query_result, columns)
        media = "text/csv"
    return Response(
        content=payload,
        media_type=media,
        headers={"Content-Disposition": f"attachment; filename=querydesk-export.{fmt}"},
    )


@app.get("/api/history")
def list_history():
    return history.list_runs()


@app.get("/api/reports")
def list_reports():
    return history.list_reports()


@app.post("/api/reports", status_code=201)
def create_report(body: ReportIn):
    _connection_or_404(body.connection_id)
    if any(r["name"] == body.name for r in history.list_reports()):
        raise HTTPException(409, f"A report named '{body.name}' already exists")
    report_id = history.save_report(
        body.connection_id, body.name, body.request_text, body.sql, body.explanation
    )
    return history.get_report(report_id)


@app.delete("/api/reports/{report_id}", status_code=204)
def delete_report(report_id: int):
    history.delete_report(report_id)


@app.get("/api/reports/{report_id}")
def get_report(report_id: int):
    report = history.get_report(report_id)
    if report is None:
        raise HTTPException(404, "Report not found")
    return report
