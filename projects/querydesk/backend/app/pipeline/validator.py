"""SQL validation against the catalog.

Order of enforcement, rejecting on the first failure:
  1. parses cleanly
  2. exactly one statement
  3. SELECT only: no DDL, DML, PRAGMA, or ATTACH anywhere in the tree
  4. every referenced table and column exists in the catalog
  5. no SELECT * (expanded to explicit columns from the catalog)
  6. LIMIT present, capped at ROW_LIMIT

Timeouts are enforced at execution time by the connector. The rewritten
SQL (expanded stars, injected LIMIT) is what actually runs, so the model
and the user can never smuggle anything past the catalog.
"""

from dataclasses import dataclass, field

import sqlglot
from sqlglot import exp

from ..config import ROW_LIMIT

FORBIDDEN_NODES = tuple(
    node
    for node in (
        getattr(exp, name, None)
        for name in (
            "Insert", "Update", "Delete", "Merge", "Create", "Drop", "Alter",
            "TruncateTable", "Pragma", "Attach", "Detach", "Command",
            "Transaction", "Commit", "Rollback", "Grant",
        )
    )
    if node is not None
)

SET_OP_NODES = tuple(
    node
    for node in (getattr(exp, name, None) for name in ("Union", "Except", "Intersect"))
    if node is not None
)


@dataclass
class ValidationResult:
    ok: bool
    sql: str
    error: str | None = None
    notes: list[str] = field(default_factory=list)


def validate_sql(sql: str, schema: dict[str, set[str]]) -> ValidationResult:
    """Validate and rewrite SQL against a {TABLE: {COLUMNS}} schema map."""
    sql = (sql or "").strip().rstrip(";")
    if not sql:
        return ValidationResult(False, sql, "The SQL statement is empty")

    try:
        statements = [s for s in sqlglot.parse(sql, read="sqlite") if s is not None]
    except sqlglot.errors.ParseError as e:
        return ValidationResult(False, sql, f"SQL does not parse: {e.errors[0]['description'] if e.errors else e}")

    if len(statements) != 1:
        return ValidationResult(
            False, sql, f"Expected a single statement, found {len(statements)}"
        )
    root = statements[0]

    if not isinstance(root, (exp.Select, *SET_OP_NODES)):
        return ValidationResult(
            False, sql, f"Only SELECT statements are allowed, got {root.key.upper()}"
        )
    for node in root.walk():
        node = node[0] if isinstance(node, tuple) else node
        if isinstance(node, FORBIDDEN_NODES):
            return ValidationResult(
                False, sql,
                f"Only read-only SELECT statements are allowed; {node.key.upper()} is not permitted",
            )

    error = _check_identifiers(root, schema)
    if error:
        return ValidationResult(False, sql, error)

    notes: list[str] = []
    error = _expand_stars(root, schema, notes)
    if error:
        return ValidationResult(False, sql, error)

    _enforce_limit(root, notes)

    return ValidationResult(True, root.sql(dialect="sqlite"), notes=notes)


def _iter_nodes(root):
    for item in root.walk():
        yield item[0] if isinstance(item, tuple) else item


def _physical_sources(root, schema):
    """Map alias-or-name -> catalog table for every physical table reference.

    Returns (sources, error). CTE names are treated like subquery sources:
    their output columns come from their own selects, not the catalog.
    """
    cte_names = {
        cte.alias_or_name.upper()
        for node in _iter_nodes(root)
        if isinstance(node, exp.CTE)
        for cte in [node]
    }
    sources: dict[str, str] = {}
    for node in _iter_nodes(root):
        if isinstance(node, exp.Subquery):
            if node.alias:
                sources[node.alias.upper()] = None
            continue
        if not isinstance(node, exp.Table):
            continue
        name = node.name.upper()
        if name in cte_names:
            if node.alias:
                sources[node.alias.upper()] = None
            sources.setdefault(name, None)
            continue
        if name not in schema:
            return None, f"Unknown table: {node.name}"
        sources[(node.alias or node.name).upper()] = name
    return sources, None


def _subquery_outputs(root):
    """Output names exposed by subqueries, CTEs, and derived tables.

    Returns (all_outputs, alias_outputs). Bare column outputs are excluded
    from alias_outputs because they are validated as columns in their own
    right; treating them as known names would let an invented column inside
    a derived table satisfy an unqualified reference.
    """
    all_outputs: set[str] = set()
    alias_outputs: set[str] = set()
    for node in _iter_nodes(root):
        if isinstance(node, (exp.Subquery, exp.CTE)):
            inner = node.this
            if isinstance(inner, exp.Select):
                for e in inner.expressions:
                    name = e.alias_or_name
                    if not name or isinstance(e, exp.Star):
                        continue
                    all_outputs.add(name.upper())
                    if isinstance(e, exp.Alias):
                        alias_outputs.add(name.upper())
    return all_outputs, alias_outputs


def _check_identifiers(root, schema):
    sources, error = _physical_sources(root, schema)
    if error:
        return error
    known_from_tables = {
        col for table in sources.values() if table for col in schema[table]
    }
    subquery_cols, subquery_aliases = _subquery_outputs(root)
    select_aliases = {
        e.alias.upper()
        for node in _iter_nodes(root)
        if isinstance(node, exp.Select)
        for e in node.expressions
        if isinstance(e, exp.Alias) and e.alias
    }
    for node in _iter_nodes(root):
        if not isinstance(node, exp.Column) or isinstance(node.this, exp.Star):
            continue
        column = node.name.upper()
        qualifier = node.table.upper() if node.table else None
        if qualifier:
            if qualifier not in sources:
                return f"Unknown table or alias: {node.table}"
            table = sources[qualifier]
            if table is None:
                # Subquery or CTE alias; its outputs were collected above.
                if column not in subquery_cols and column not in select_aliases:
                    return f"Unknown column: {node.table}.{node.name}"
            elif column not in schema[table]:
                return f"Unknown column: {node.table}.{node.name}"
        else:
            if (
                column not in known_from_tables
                and column not in subquery_aliases
                and column not in select_aliases
            ):
                return f"Unknown column: {node.name}"
    return None


def _expand_stars(root, schema, notes):
    # Innermost selects first, so derived-table stars are already explicit
    # by the time an outer select is expanded.
    selects = [n for n in _iter_nodes(root) if isinstance(n, exp.Select)]
    for select in reversed(selects):
        if not any(_is_star(e) for e in select.expressions):
            continue
        local_sources, error = _physical_sources(select, schema)
        if error:
            return error
        expanded: list[exp.Expression] = []
        for e in select.expressions:
            if isinstance(e, exp.Star):
                if not local_sources or any(t is None for t in local_sources.values()):
                    return (
                        "SELECT * cannot be expanded here; list the columns explicitly"
                    )
                qualify = len(local_sources) > 1
                for alias, table in local_sources.items():
                    expanded.extend(_table_columns(alias, table, schema, qualify))
            elif isinstance(e, exp.Column) and isinstance(e.this, exp.Star):
                qualifier = e.table.upper()
                table = local_sources.get(qualifier)
                if table is None:
                    return (
                        f"SELECT {e.table}.* cannot be expanded; "
                        "list the columns explicitly"
                    )
                expanded.extend(_table_columns(qualifier, table, schema, True))
            else:
                expanded.append(e)
        select.set("expressions", expanded)
        notes.append("SELECT * was expanded to explicit columns")
    return None


def _is_star(e):
    return isinstance(e, exp.Star) or (
        isinstance(e, exp.Column) and isinstance(e.this, exp.Star)
    )


def _table_columns(alias, table, schema, qualify):
    # Catalog stores columns as a set; sort for a stable, reviewable expansion.
    return [
        exp.column(col, table=alias if qualify else None)
        for col in sorted(schema[table])
    ]


def _enforce_limit(root, notes):
    limit_node = root.args.get("limit")
    if limit_node is None:
        root.limit(ROW_LIMIT, copy=False)
        notes.append(f"LIMIT {ROW_LIMIT} was added")
        return
    literal = limit_node.expression
    try:
        current = int(literal.this)
    except (TypeError, ValueError):
        current = None
    if current is None or current > ROW_LIMIT:
        limit_node.set("expression", exp.Literal.number(ROW_LIMIT))
        notes.append(f"LIMIT was capped at {ROW_LIMIT}")
