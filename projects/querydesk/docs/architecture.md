# QueryDesk architecture

## The four layers

```
UI (React)
  |
FastAPI
  |
  +-- Connectors   read-only access to legacy databases
  +-- Catalog      what the schema means (structure + dictionary)
  +-- Pipeline     request -> prompt -> SQL -> validation -> repair
  +-- Delivery     decoded grids, XLSX/CSV export, history, saved reports
```

### Connectors (`app/connectors/`)

`LegacyConnector` is the only way the app touches a legacy database:
`list_tables()`, `list_columns(table)`, `explain(sql)`, and
`execute_readonly(sql, row_limit, timeout_s)`. `SQLiteConnector` is complete
and backs the demo; it opens the file in read-only mode (`mode=ro`) and
aborts statements past the timeout with a progress handler, so read-only and
bounded runtime are engine-level guarantees. `DB2ODBCConnector` and
`SQLServerConnector` are stubs that handle connection strings and name the
ODBC driver each needs; they are the only intentional incompleteness in the
repo.

### Catalog (`app/catalog/`)

The catalog lives in `app.db` (SQLAlchemy Core; the legacy side is never
mapped as ORM models). It is populated from two directions:

1. Introspection: structure (tables, columns, physical types) from the
   connector.
2. Dictionary upload: business meaning layered on top. Descriptions, code
   maps ("A=Active; P=Paid out"), the CYMD format flag, preferred join
   paths, and the per-column opt-in to share sample values.

Merge rule: the dictionary wins for descriptions, codes, and formats;
introspection wins for structure and types. Dictionary entries that name
tables or columns the live schema does not have are reported in the merge
preview and skipped. Uploads always go through preview before commit.

The catalog is the single source of truth the LLM sees.

## The generation and validation pipeline

```
request text
   -> prompt built from the catalog (descriptions, codes, joins, CYMD note)
   -> claude-sonnet-4-6 returns {sql, explanation}
   -> validator (sqlglot)
        1 parses cleanly
        2 single statement
        3 SELECT only; no DDL/DML/PRAGMA/ATTACH anywhere in the tree
        4 every table and column exists in the catalog
          (reject on the first unknown identifier, named in the error)
        5 no SELECT * (expanded to explicit catalog columns)
        6 LIMIT injected if absent, capped at 5,000
   -> on failure: the error is shown to the user AND sent back to the
      model for exactly one repair attempt, then the pipeline gives up
   -> dry run is the user's call: the SQL, the plain-English explanation,
      and the validation verdict are on screen before Run is pressed
   -> execution through the connector: read-only, row-limited, 30s timeout
   -> every run lands in history; any run can be saved as a named report
```

The same validator runs again on execution, so hand-edited SQL gets no
shortcut around the rules.

## Why the LLM is schema-constrained

The model is given the catalog and nothing else. It never sees row data;
the one exception is distinct values of columns a human explicitly flagged
"share sample values" in the catalog editor, intended for low-cardinality
code columns. Its output is treated as untrusted text: whatever it returns
is parsed, checked against the catalog, rewritten (star expansion, LIMIT),
and only then executed, through a connector that is itself read-only.

What it can never do, regardless of what it generates:

- write, delete, or alter anything (SELECT-only validation plus a
  read-only connection)
- touch a table or column that is not in the catalog
- return unbounded result sets (LIMIT cap plus fetch cap plus timeout)
- run more than one statement
- exfiltrate row data through the prompt (it is never in the prompt)

## Delivery

Results come back with per-column catalog metadata: the grid shows the
physical name and the business name together (LNSTCD / "Loan status"),
decoded labels next to raw codes, and CYMD integers rendered as dates.
XLSX export writes formatted headers, freezes the top row, converts CYMD
columns to real Excel dates, and adds a decoded column after each coded
one. CSV export mirrors the same decoding.
