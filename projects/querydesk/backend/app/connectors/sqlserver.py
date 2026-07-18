from .base import ColumnInfo, LegacyConnector, QueryResult

DRIVER_NOTE = (
    "SQL Server connections require pyodbc plus Microsoft's 'ODBC Driver 18 "
    "for SQL Server'. Install both, then this connector can be completed "
    "against INFORMATION_SCHEMA."
)


class SQLServerConnector(LegacyConnector):
    """Stub connector for SQL Server over ODBC.

    Connection strings look like:
      DRIVER={ODBC Driver 18 for SQL Server};SERVER=legacy01;DATABASE=MIPROD;UID=...;PWD=...
    """

    dialect = "tsql"

    def __init__(self, dsn: str):
        super().__init__(dsn)
        if "DRIVER=" not in dsn.upper() and "DSN=" not in dsn.upper():
            self.dsn = "DRIVER={ODBC Driver 18 for SQL Server};" + dsn

    def list_tables(self) -> list[str]:
        raise NotImplementedError(DRIVER_NOTE)

    def list_columns(self, table: str) -> list[ColumnInfo]:
        raise NotImplementedError(DRIVER_NOTE)

    def explain(self, sql: str) -> str:
        raise NotImplementedError(DRIVER_NOTE)

    def execute_readonly(self, sql: str, row_limit: int, timeout_s: int) -> QueryResult:
        raise NotImplementedError(DRIVER_NOTE)
