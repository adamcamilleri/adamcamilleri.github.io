"""Prompt assembly from the catalog.

The catalog is the only thing the model ever sees about the database:
structure, business descriptions, code maps, join paths, and, for columns
explicitly flagged share_samples, a short list of distinct values. Row
data never enters the prompt otherwise.
"""

from datetime import date

from ..catalog.store import CatalogStore
from ..connectors.base import LegacyConnector
from ..cymd import date_to_cymd

SYSTEM_RULES = """You translate business reporting requests into SQL for a legacy \
mortgage servicing database. The physical schema uses cryptic six-character \
AS/400 names; the catalog below is the authoritative description of every \
table and column you may use.

Hard rules:
- Produce exactly one SELECT statement in the SQLite dialect. Never write \
DDL or DML of any kind.
- Reference only tables and columns listed in the catalog. Never invent names.
- List columns explicitly; never use SELECT *.
- Include a LIMIT of 5000 or less.
- Date columns marked CYMD are DECIMAL(8,0) integers like 20260331. Compare \
them numerically (MTDTE BETWEEN 20260401 AND 20260630). Derive a month key \
with CAST(col / 100 AS INTEGER) and a year with CAST(col / 10000 AS INTEGER).
- Use the documented join paths when combining tables.
- Filter coded columns by their raw codes (LNSTCD = 'A'), not their labels.
- Add ORDER BY only when the request implies an ordering, such as a time \
series or a ranking.
- No SQL comments.

Respond with a JSON object and nothing else:
{"sql": "<the SELECT statement>", "explanation": "<one plain-English paragraph \
describing what the query returns and exactly which filters it applies>"}"""


def build_system_prompt(
    store: CatalogStore, connection_id: int, connector: LegacyConnector
) -> str:
    lines = [SYSTEM_RULES, "", "Catalog:"]
    for table in store.catalog_for_connection(connection_id):
        header = table["table_name"]
        if table["description"]:
            header += f" -- {table['description']}"
        lines.append(f"\nTABLE {header}")
        for col in table["columns"]:
            parts = [f"  {col['column_name']} {col['physical_type']}"]
            if col["description"]:
                parts.append(f"-- {col['description']}")
            if col["value_format"]:
                parts.append(f"[format: {col['value_format']}]")
            if col["codes"]:
                parts.append(f"[codes: {col['codes']}]")
            if col["share_samples"]:
                samples = _sample_values(
                    connector, table["table_name"], col["column_name"]
                )
                if samples:
                    parts.append(f"[values seen: {', '.join(samples)}]")
            lines.append(" ".join(parts))
    joins = store.join_paths_for_connection(connection_id)
    if joins:
        lines.append("\nJoin paths:")
        for j in joins:
            desc = f" -- {j['description']}" if j["description"] else ""
            lines.append(
                f"  {j['left_table']}.{j['left_column']} = "
                f"{j['right_table']}.{j['right_column']}{desc}"
            )
    return "\n".join(lines)


def build_user_message(request_text: str) -> str:
    today = date.today()
    return (
        f"Current date: {today.isoformat()} (CYMD {date_to_cymd(today)}).\n\n"
        f"Report request: {request_text}"
    )


def _sample_values(connector, table, column, cap=12):
    # Only reached for columns the catalog editor flagged share_samples;
    # meant for low-cardinality code columns.
    try:
        result = connector.execute_readonly(
            f'SELECT DISTINCT "{column}" FROM "{table}" LIMIT {cap}',
            row_limit=cap,
            timeout_s=5,
        )
    except Exception:
        return []
    return [str(r[0]) for r in result.rows if r[0] is not None]
