"""Attach catalog meaning to raw query results.

Result columns are matched to catalog columns by name (aliases that don't
match a physical column simply carry no metadata). The grid uses this to
show business names and decoded values next to raw codes.
"""

from ..catalog.store import CatalogStore


def describe_columns(
    store: CatalogStore, connection_id: int, column_names: list[str]
) -> list[dict]:
    meta = store.column_meta_map(connection_id)
    described = []
    for name in column_names:
        entry = meta.get(name.upper(), {})
        described.append(
            {
                "name": name,
                "business_name": entry.get("business_name"),
                "codes": entry.get("codes"),
                "value_format": entry.get("value_format"),
            }
        )
    return described
