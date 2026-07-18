from abc import ABC, abstractmethod
from dataclasses import dataclass, field


class ConnectorError(Exception):
    pass


@dataclass
class ColumnInfo:
    name: str
    type_name: str


@dataclass
class QueryResult:
    columns: list[str]
    rows: list[tuple] = field(default_factory=list)
    truncated: bool = False
    runtime_ms: int = 0


class LegacyConnector(ABC):
    """Read-only access to a legacy database.

    Every query the app runs against a legacy system goes through this
    interface, so the demo SQLite database and a real DB2/SQL Server
    connection are interchangeable from the catalog's and pipeline's
    point of view.
    """

    dialect: str = "sqlite"

    def __init__(self, dsn: str):
        self.dsn = dsn

    @abstractmethod
    def list_tables(self) -> list[str]:
        """Return base table names, excluding system tables."""

    @abstractmethod
    def list_columns(self, table: str) -> list[ColumnInfo]:
        """Return columns for a table in ordinal order."""

    @abstractmethod
    def explain(self, sql: str) -> str:
        """Return the engine's query plan as display text."""

    @abstractmethod
    def execute_readonly(self, sql: str, row_limit: int, timeout_s: int) -> QueryResult:
        """Run a validated SELECT and return at most row_limit rows."""
