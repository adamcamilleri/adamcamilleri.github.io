"""App-state database (app.db): connections, catalog, history, reports.

This is QueryDesk's own storage, distinct from any legacy database it
connects to. SQLAlchemy Core only; the legacy side is never mapped.
"""

from pathlib import Path

from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
    create_engine,
)

metadata = MetaData()

connections = Table(
    "connections",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(120), nullable=False, unique=True),
    Column("kind", String(20), nullable=False),
    Column("dsn", Text, nullable=False),
    Column("is_demo", Integer, nullable=False, default=0),
)

catalog_tables = Table(
    "catalog_tables",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("connection_id", Integer, ForeignKey("connections.id"), nullable=False),
    Column("table_name", String(128), nullable=False),
    Column("description", Text),
    UniqueConstraint("connection_id", "table_name"),
)

catalog_columns = Table(
    "catalog_columns",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("table_id", Integer, ForeignKey("catalog_tables.id"), nullable=False),
    Column("column_name", String(128), nullable=False),
    Column("ordinal", Integer, nullable=False),
    Column("physical_type", String(64), nullable=False),
    Column("description", Text),
    # Semicolon-separated code map as entered ("A=Active; P=Paid out")
    Column("codes", Text),
    # Display format hint; "CYMD" marks DECIMAL(8,0) date columns
    Column("value_format", String(20)),
    Column("share_samples", Integer, nullable=False, default=0),
    UniqueConstraint("table_id", "column_name"),
)

join_paths = Table(
    "join_paths",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("connection_id", Integer, ForeignKey("connections.id"), nullable=False),
    Column("left_table", String(128), nullable=False),
    Column("left_column", String(128), nullable=False),
    Column("right_table", String(128), nullable=False),
    Column("right_column", String(128), nullable=False),
    Column("description", Text),
)

request_history = Table(
    "request_history",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("connection_id", Integer, ForeignKey("connections.id"), nullable=False),
    Column("request_text", Text, nullable=False),
    Column("generated_sql", Text, nullable=False),
    Column("explanation", Text),
    Column("status", String(10), nullable=False),
    Column("error", Text),
    Column("row_count", Integer),
    Column("runtime_ms", Integer),
    Column("created_at", String(32), nullable=False),
)

saved_reports = Table(
    "saved_reports",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("connection_id", Integer, ForeignKey("connections.id"), nullable=False),
    Column("name", String(200), nullable=False, unique=True),
    Column("request_text", Text, nullable=False),
    Column("sql", Text, nullable=False),
    Column("explanation", Text),
    Column("created_at", String(32), nullable=False),
)


def make_engine(db_path: Path):
    db_path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(f"sqlite:///{db_path.as_posix()}")
    metadata.create_all(engine)
    return engine
