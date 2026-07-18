from .base import ColumnInfo, ConnectorError, LegacyConnector, QueryResult
from .db2_odbc import DB2ODBCConnector
from .sqlite_connector import SQLiteConnector
from .sqlserver import SQLServerConnector

CONNECTOR_KINDS = {
    "sqlite": SQLiteConnector,
    "db2_odbc": DB2ODBCConnector,
    "sqlserver": SQLServerConnector,
}


def build_connector(kind: str, dsn: str) -> LegacyConnector:
    """Instantiate the connector class registered for a connection kind."""
    try:
        cls = CONNECTOR_KINDS[kind]
    except KeyError:
        raise ConnectorError(f"Unknown connection type: {kind}")
    return cls(dsn)
