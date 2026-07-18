from datetime import datetime, timezone

from sqlalchemy import delete, insert, select

from . import appdb


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


class HistoryStore:
    def __init__(self, engine):
        self.engine = engine

    def record_run(
        self,
        connection_id: int,
        request_text: str,
        sql: str,
        explanation: str | None,
        status: str,
        error: str | None = None,
        row_count: int | None = None,
        runtime_ms: int | None = None,
    ) -> int:
        with self.engine.begin() as db:
            result = db.execute(
                insert(appdb.request_history).values(
                    connection_id=connection_id,
                    request_text=request_text,
                    generated_sql=sql,
                    explanation=explanation,
                    status=status,
                    error=error,
                    row_count=row_count,
                    runtime_ms=runtime_ms,
                    created_at=_now(),
                )
            )
            return result.inserted_primary_key[0]

    def list_runs(self, limit: int = 100) -> list[dict]:
        with self.engine.connect() as db:
            rows = (
                db.execute(
                    select(appdb.request_history)
                    .order_by(appdb.request_history.c.id.desc())
                    .limit(limit)
                )
                .mappings()
                .all()
            )
        return [dict(r) for r in rows]

    def save_report(
        self,
        connection_id: int,
        name: str,
        request_text: str,
        sql: str,
        explanation: str | None,
    ) -> int:
        with self.engine.begin() as db:
            result = db.execute(
                insert(appdb.saved_reports).values(
                    connection_id=connection_id,
                    name=name,
                    request_text=request_text,
                    sql=sql,
                    explanation=explanation,
                    created_at=_now(),
                )
            )
            return result.inserted_primary_key[0]

    def list_reports(self) -> list[dict]:
        with self.engine.connect() as db:
            rows = (
                db.execute(
                    select(appdb.saved_reports).order_by(appdb.saved_reports.c.name)
                )
                .mappings()
                .all()
            )
        return [dict(r) for r in rows]

    def get_report(self, report_id: int) -> dict | None:
        with self.engine.connect() as db:
            row = (
                db.execute(
                    select(appdb.saved_reports).where(
                        appdb.saved_reports.c.id == report_id
                    )
                )
                .mappings()
                .first()
            )
        return dict(row) if row else None

    def delete_report(self, report_id: int) -> None:
        with self.engine.begin() as db:
            db.execute(
                delete(appdb.saved_reports).where(appdb.saved_reports.c.id == report_id)
            )
