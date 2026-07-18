"""Catalog store: the single source of truth about a legacy schema.

Structure (tables, columns, types) comes from connector introspection;
business meaning (descriptions, code maps, join paths) comes from a data
dictionary. The merge rule is: dictionary wins for descriptions and codes,
introspection wins for structure and types.
"""

from sqlalchemy import delete, insert, select, update

from .. import appdb


def parse_codes(codes_text):
    """Parse "A=Active; P=Paid out" into an ordered {code: label} dict."""
    if not codes_text:
        return None
    mapping = {}
    for part in str(codes_text).split(";"):
        part = part.strip()
        if not part or "=" not in part:
            continue
        code, label = part.split("=", 1)
        mapping[code.strip()] = label.strip()
    return mapping or None


class CatalogStore:
    def __init__(self, engine):
        self.engine = engine

    # connections

    def add_connection(self, name: str, kind: str, dsn: str, is_demo: bool = False) -> int:
        with self.engine.begin() as db:
            result = db.execute(
                insert(appdb.connections).values(
                    name=name, kind=kind, dsn=dsn, is_demo=1 if is_demo else 0
                )
            )
            return result.inserted_primary_key[0]

    def list_connections(self) -> list[dict]:
        with self.engine.connect() as db:
            rows = db.execute(select(appdb.connections)).mappings().all()
        return [dict(r) for r in rows]

    def get_connection(self, connection_id: int) -> dict | None:
        with self.engine.connect() as db:
            row = (
                db.execute(
                    select(appdb.connections).where(
                        appdb.connections.c.id == connection_id
                    )
                )
                .mappings()
                .first()
            )
        return dict(row) if row else None

    def find_connection_by_name(self, name: str) -> dict | None:
        with self.engine.connect() as db:
            row = (
                db.execute(
                    select(appdb.connections).where(appdb.connections.c.name == name)
                )
                .mappings()
                .first()
            )
        return dict(row) if row else None

    # introspection sync

    def sync_introspection(self, connection_id: int, connector) -> None:
        """Refresh structure from the live schema.

        New tables/columns are added, types are updated in place, and
        anything that no longer exists is dropped. Descriptions and codes
        on surviving columns are preserved: they belong to the dictionary
        layer, which introspection must not clobber.
        """
        live = {t: connector.list_columns(t) for t in connector.list_tables()}
        with self.engine.begin() as db:
            existing_tables = {
                r.table_name: r.id
                for r in db.execute(
                    select(appdb.catalog_tables).where(
                        appdb.catalog_tables.c.connection_id == connection_id
                    )
                )
            }
            for gone in set(existing_tables) - set(live):
                table_id = existing_tables[gone]
                db.execute(
                    delete(appdb.catalog_columns).where(
                        appdb.catalog_columns.c.table_id == table_id
                    )
                )
                db.execute(
                    delete(appdb.catalog_tables).where(
                        appdb.catalog_tables.c.id == table_id
                    )
                )
            for table_name, columns in live.items():
                table_id = existing_tables.get(table_name)
                if table_id is None:
                    table_id = db.execute(
                        insert(appdb.catalog_tables).values(
                            connection_id=connection_id, table_name=table_name
                        )
                    ).inserted_primary_key[0]
                existing_cols = {
                    r.column_name: r
                    for r in db.execute(
                        select(appdb.catalog_columns).where(
                            appdb.catalog_columns.c.table_id == table_id
                        )
                    )
                }
                live_names = {c.name for c in columns}
                for gone in set(existing_cols) - live_names:
                    db.execute(
                        delete(appdb.catalog_columns).where(
                            appdb.catalog_columns.c.id == existing_cols[gone].id
                        )
                    )
                for ordinal, col in enumerate(columns):
                    if col.name in existing_cols:
                        db.execute(
                            update(appdb.catalog_columns)
                            .where(
                                appdb.catalog_columns.c.id == existing_cols[col.name].id
                            )
                            .values(ordinal=ordinal, physical_type=col.type_name)
                        )
                    else:
                        db.execute(
                            insert(appdb.catalog_columns).values(
                                table_id=table_id,
                                column_name=col.name,
                                ordinal=ordinal,
                                physical_type=col.type_name,
                            )
                        )

    # reads

    def catalog_for_connection(self, connection_id: int) -> list[dict]:
        with self.engine.connect() as db:
            tables = (
                db.execute(
                    select(appdb.catalog_tables)
                    .where(appdb.catalog_tables.c.connection_id == connection_id)
                    .order_by(appdb.catalog_tables.c.table_name)
                )
                .mappings()
                .all()
            )
            out = []
            for t in tables:
                cols = (
                    db.execute(
                        select(appdb.catalog_columns)
                        .where(appdb.catalog_columns.c.table_id == t["id"])
                        .order_by(appdb.catalog_columns.c.ordinal)
                    )
                    .mappings()
                    .all()
                )
                out.append({**dict(t), "columns": [dict(c) for c in cols]})
        return out

    def join_paths_for_connection(self, connection_id: int) -> list[dict]:
        with self.engine.connect() as db:
            rows = (
                db.execute(
                    select(appdb.join_paths).where(
                        appdb.join_paths.c.connection_id == connection_id
                    )
                )
                .mappings()
                .all()
            )
        return [dict(r) for r in rows]

    def schema_map(self, connection_id: int) -> dict[str, set[str]]:
        """Uppercased {table: {columns}} map for the validator."""
        return {
            t["table_name"].upper(): {c["column_name"].upper() for c in t["columns"]}
            for t in self.catalog_for_connection(connection_id)
        }

    def column_meta_map(self, connection_id: int) -> dict[str, dict]:
        """Result-decoding metadata keyed by uppercased column name.

        Physical column names are unique enough in practice (shared names
        like LNNBR carry the same meaning everywhere); the first column
        that defines codes or a format wins.
        """
        meta: dict[str, dict] = {}
        for t in self.catalog_for_connection(connection_id):
            for c in t["columns"]:
                key = c["column_name"].upper()
                entry = meta.setdefault(
                    key,
                    {"business_name": None, "codes": None, "value_format": None},
                )
                if entry["business_name"] is None and c["description"]:
                    entry["business_name"] = c["description"]
                if entry["codes"] is None and c["codes"]:
                    entry["codes"] = parse_codes(c["codes"])
                if entry["value_format"] is None and c["value_format"]:
                    entry["value_format"] = c["value_format"]
        return meta

    # edits

    def update_table(self, table_id: int, description) -> None:
        with self.engine.begin() as db:
            db.execute(
                update(appdb.catalog_tables)
                .where(appdb.catalog_tables.c.id == table_id)
                .values(description=description)
            )

    def update_column(self, column_id: int, fields: dict) -> None:
        allowed = {"description", "codes", "value_format", "share_samples"}
        values = {k: v for k, v in fields.items() if k in allowed}
        if not values:
            return
        with self.engine.begin() as db:
            db.execute(
                update(appdb.catalog_columns)
                .where(appdb.catalog_columns.c.id == column_id)
                .values(**values)
            )

    def replace_join_paths(self, connection_id: int, joins: list[dict]) -> None:
        with self.engine.begin() as db:
            db.execute(
                delete(appdb.join_paths).where(
                    appdb.join_paths.c.connection_id == connection_id
                )
            )
            for j in joins:
                db.execute(insert(appdb.join_paths).values(connection_id=connection_id, **j))
