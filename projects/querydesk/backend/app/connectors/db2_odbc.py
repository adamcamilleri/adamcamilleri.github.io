from .base import ColumnInfo, LegacyConnector, QueryResult

DRIVER_NOTE = (
    "DB2 for i connections require pyodbc plus the IBM i Access ODBC driver "
    "(IBM i Access Client Solutions). Install both, then this connector can "
    "be completed against SYSTABLES/SYSCOLUMNS."
)


class DB2ODBCConnector(LegacyConnector):
    """Stub connector for DB2 on IBM i (AS/400) over ODBC.

    Connection strings look like:
      DRIVER={IBM i Access ODBC Driver};SYSTEM=PROD400;UID=QRYUSER;PWD=...
    """

    dialect = "db2"

    def __init__(self, dsn: str):
        super().__init__(dsn)
        if "DRIVER=" not in dsn.upper() and "DSN=" not in dsn.upper():
            self.dsn = "DRIVER={IBM i Access ODBC Driver};" + dsn

    def list_tables(self) -> list[str]:
        raise NotImplementedError(DRIVER_NOTE)

    def list_columns(self, table: str) -> list[ColumnInfo]:
        raise NotImplementedError(DRIVER_NOTE)

    def explain(self, sql: str) -> str:
        raise NotImplementedError(DRIVER_NOTE)

    def execute_readonly(self, sql: str, row_limit: int, timeout_s: int) -> QueryResult:
        raise NotImplementedError(DRIVER_NOTE)
