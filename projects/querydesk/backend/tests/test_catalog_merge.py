from app.catalog.dictionary import (
    Dictionary,
    apply_dictionary,
    merge_preview,
    parse_dictionary,
)
from app.connectors.base import ColumnInfo


class FakeConnector:
    """Introspection-only stand-in for a live legacy schema."""

    def __init__(self, tables):
        self.tables = tables

    def list_tables(self):
        return list(self.tables)

    def list_columns(self, table):
        return [ColumnInfo(name=n, type_name=t) for n, t in self.tables[table]]


def seeded_store(store):
    connection_id = store.add_connection("test", "sqlite", "unused.db")
    connector = FakeConnector(
        {
            "LNMAST": [("LNNBR", "DECIMAL(10,0)"), ("LNSTCD", "CHAR(1)")],
            "PRPTY": [("LNNBR", "DECIMAL(10,0)"), ("PRVCD", "CHAR(2)")],
        }
    )
    store.sync_introspection(connection_id, connector)
    return connection_id, connector


def dictionary():
    doc = Dictionary()
    doc.tables["LNMAST"] = "Loan master"
    doc.columns[("LNMAST", "LNSTCD")] = {
        "description": "Loan status",
        "codes": "A=Active; P=Paid out",
        "value_format": None,
        "share_samples": 0,
    }
    doc.columns[("LNMAST", "GHOST")] = {
        "description": "Does not exist",
        "codes": None,
        "value_format": None,
        "share_samples": 0,
    }
    doc.tables["NOTREAL"] = "Unknown table"
    doc.joins.append(
        {
            "left_table": "LNMAST",
            "left_column": "LNNBR",
            "right_table": "PRPTY",
            "right_column": "LNNBR",
            "description": "Property on loan",
        }
    )
    return doc


def test_preview_reports_added_and_unknown(store):
    connection_id, _ = seeded_store(store)
    preview = merge_preview(store, connection_id, dictionary())
    targets = {(c["target"], c["field"]) for c in preview["added"]}
    assert ("LNMAST", "description") in targets
    assert ("LNMAST.LNSTCD", "codes") in targets
    assert "Column LNMAST.GHOST" in preview["unknown"]
    assert "Table NOTREAL" in preview["unknown"]
    assert preview["join_count"] == 1


def test_dictionary_wins_over_introspection_for_descriptions(store):
    connection_id, connector = seeded_store(store)
    apply_dictionary(store, connection_id, dictionary())
    catalog = {t["table_name"]: t for t in store.catalog_for_connection(connection_id)}
    status = next(
        c for c in catalog["LNMAST"]["columns"] if c["column_name"] == "LNSTCD"
    )
    assert status["description"] == "Loan status"
    assert status["codes"] == "A=Active; P=Paid out"

    # Re-introspecting must not clobber the dictionary layer.
    store.sync_introspection(connection_id, connector)
    catalog = {t["table_name"]: t for t in store.catalog_for_connection(connection_id)}
    status = next(
        c for c in catalog["LNMAST"]["columns"] if c["column_name"] == "LNSTCD"
    )
    assert status["description"] == "Loan status"


def test_introspection_wins_for_types(store):
    connection_id, _ = seeded_store(store)
    apply_dictionary(store, connection_id, dictionary())
    changed = FakeConnector(
        {
            "LNMAST": [("LNNBR", "DECIMAL(12,0)"), ("LNSTCD", "CHAR(1)")],
            "PRPTY": [("LNNBR", "DECIMAL(12,0)"), ("PRVCD", "CHAR(2)")],
        }
    )
    store.sync_introspection(connection_id, changed)
    catalog = {t["table_name"]: t for t in store.catalog_for_connection(connection_id)}
    loan_number = next(
        c for c in catalog["LNMAST"]["columns"] if c["column_name"] == "LNNBR"
    )
    assert loan_number["physical_type"] == "DECIMAL(12,0)"


def test_unknown_dictionary_entries_are_skipped_on_apply(store):
    connection_id, _ = seeded_store(store)
    apply_dictionary(store, connection_id, dictionary())
    schema = store.schema_map(connection_id)
    assert "NOTREAL" not in schema
    assert "GHOST" not in schema["LNMAST"]


def test_second_apply_reports_overwrites(store):
    connection_id, _ = seeded_store(store)
    apply_dictionary(store, connection_id, dictionary())
    doc = dictionary()
    doc.columns[("LNMAST", "LNSTCD")]["description"] = "Loan status code"
    preview = merge_preview(store, connection_id, doc)
    overwrites = {(c["target"], c["field"]): c for c in preview["overwritten"]}
    entry = overwrites[("LNMAST.LNSTCD", "description")]
    assert entry["old"] == "Loan status"
    assert entry["new"] == "Loan status code"


def test_csv_dictionary_parses(store):
    csv_data = (
        "KIND,TABLE,COLUMN,DESCRIPTION,CODES,FORMAT,SHARE_SAMPLES,RIGHT_TABLE,RIGHT_COLUMN\n"
        "table,LNMAST,,Loan master,,,,,\n"
        "column,LNMAST,LNSTCD,Loan status,A=Active; P=Paid out,,,,\n"
        "column,LNMAST,MTDTE,Maturity date,,CYMD,,,\n"
        "join,LNMAST,LNNBR,,,,,PRPTY,LNNBR\n"
    ).encode()
    doc = parse_dictionary(csv_data, "dict.csv")
    assert doc.tables["LNMAST"] == "Loan master"
    assert doc.columns[("LNMAST", "MTDTE")]["value_format"] == "CYMD"
    assert doc.joins[0]["right_table"] == "PRPTY"
