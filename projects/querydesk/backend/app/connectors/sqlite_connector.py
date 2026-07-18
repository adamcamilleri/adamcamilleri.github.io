import sqlite3
import time
from pathlib import Path

from .base import ColumnInfo, ConnectorError, LegacyConnector, QueryResult


class SQLiteConnector(LegacyConnector):
    """Connector for SQLite files, used by the demo MIPROD database."""

    dialect = "sqlite"

    def _connect(self) -> sqlite3.Connection:
        path = Path(self.dsn)
        if not path.exists():
            raise ConnectorError(f"Database file not found: {path}")
        # mode=ro makes read-only a database-level guarantee, not just a
        # validator promise.
        return sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True)

    def list_tables(self) -> list[str]:
        with self._connect() as db:
            rows = db.execute(
                "SELECT name FROM sqlite_master"
                " WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
                " ORDER BY name"
            ).fetchall()
        return [r[0] for r in rows]

    def list_columns(self, table: str) -> list[ColumnInfo]:
        with self._connect() as db:
            rows = db.execute(
                "SELECT name, type FROM pragma_table_info(?) ORDER BY cid", (table,)
            ).fetchall()
        if not rows:
            raise ConnectorError(f"Table not found: {table}")
        return [ColumnInfo(name=r[0], type_name=r[1] or "TEXT") for r in rows]

    def explain(self, sql: str) -> str:
        with self._connect() as db:
            rows = db.execute(f"EXPLAIN QUERY PLAN {sql}").fetchall()
        return "\n".join(str(r[-1]) for r in rows)

    def execute_readonly(self, sql: str, row_limit: int, timeout_s: int) -> QueryResult:
        deadline = time.monotonic() + timeout_s
        db = self._connect()
        # The progress handler fires every N VM instructions; returning
        # nonzero aborts the running statement, which is the only way to
        # bound runtime inside sqlite3.
        db.set_progress_handler(
            lambda: 1 if time.monotonic() > deadline else 0, 50_000
        )
        started = time.monotonic()
        try:
            cursor = db.execute(sql)
            columns = [d[0] for d in cursor.description] if cursor.description else []
            rows = cursor.fetchmany(row_limit + 1)
        except sqlite3.OperationalError as e:
            if "interrupted" in str(e).lower():
                raise ConnectorError(f"Query exceeded the {timeout_s}s timeout")
            raise ConnectorError(str(e))
        finally:
            db.close()
        runtime_ms = int((time.monotonic() - started) * 1000)
        truncated = len(rows) > row_limit
        return QueryResult(
            columns=columns,
            rows=rows[:row_limit],
            truncated=truncated,
            runtime_ms=runtime_ms,
        )
