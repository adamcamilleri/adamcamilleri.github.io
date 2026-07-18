# QueryDesk

QueryDesk is a self-serve reporting layer for legacy databases. Business users type plain-language report requests and get validated, read-only SQL compiled against a legacy schema, with results they can preview and export to Excel. It exists because thousands of banks, insurers, and manufacturers still run DB2 on AS/400 or old Oracle/SQL Server with cryptic six-character table names, coded status columns, and one overloaded analyst fielding every report request.

## Screenshots

- `docs/screenshots/ask.png` (placeholder)
- `docs/screenshots/catalog.png` (placeholder)
- `docs/screenshots/history.png` (placeholder)

## Setup

Requirements: Python 3.12, Node 20.

```bash
make seed   # install deps, build demo_mars.db + app.db, load the dictionary
make dev    # uvicorn on :8000 and vite on :5173
```

Open http://localhost:5173. Without `make`, run `./dev.sh` (Git Bash on Windows), or start the two halves yourself:

```bash
cd backend && .venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

Tests:

```bash
make test   # pytest: validator rules, catalog merge, CYMD, end-to-end
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | SQL generation via the Anthropic API (claude-sonnet-4-6). Without it, generation shows a banner; catalog browsing, manual SQL with validation, and export keep working. |
| `QUERYDESK_DATA_DIR` | Optional override for where `app.db` and `demo_mars.db` live. |
| `QUERYDESK_ASK_LIMIT_PER_HOUR` | Generation requests allowed per client IP per hour (default 20, 0 disables). Protects API credits on public deploys. |
| `QUERYDESK_STATIC_DIR` | Directory of built frontend assets for FastAPI to serve. Set by the Dockerfile; unset in local dev, where vite serves the app. |

See `.env.example`.

## Deploying

The repo ships a `Dockerfile` (multi-stage: vite build, then a Python image where FastAPI serves both the API and the built frontend) and a `render.yaml` blueprint at the repo root. On Render: New > Blueprint > pick this repo, set `ANTHROPIC_API_KEY`, deploy. A fresh instance seeds `demo_mars.db` and the catalog on first boot, so ephemeral disks are fine; request history resets on restart, which is acceptable for a demo. The same image runs anywhere Docker does:

```bash
docker build -t querydesk .
docker run -p 8000:8000 -e ANTHROPIC_API_KEY=sk-... querydesk
```

## The demo schema and real AS/400 conventions

`demo_mars.db` is a SQLite snapshot of MIPROD, a fictional mortgage servicing system shaped like a real DB2-on-IBM-i library:

- Six-character object names: `LNMAST` (loan master), `BRWR` (borrowers), `PRPTY` (property), `PYHIST` (payment history), `RNWL` (renewals), `TXARR` (tax arrears), plus `STSCDS`, the generic code-lookup table every AS/400 shop ends up with.
- Every date is `DECIMAL(8,0)` in CYMD form: `20260331` means 2026-03-31. Nothing is a date type. The catalog knows which columns are CYMD, generated SQL compares them numerically, and exports convert them back to real dates.
- Status is a coded `CHAR(1)`: `LNSTCD` is A=Active, P=Paid out, D=Default, W=Written off. The dictionary carries those mappings so the grid and exports can decode them.
- ~3,000 loans, ~80,000 payment rows, a renewal wave clustered in 2026, and a small default book with overlapping tax arrears.

`demo_dictionary.xlsx` is the business dictionary for that schema; `make seed` loads it automatically, and the same upload flow works for your own dictionary (XLSX with Tables/Columns/Joins sheets, or a flat CSV with a KIND column).

## What the model can and cannot do

The LLM sees the catalog only: table and column descriptions, code mappings, join paths, and a dialect note. It never sees row data (except distinct values of columns explicitly flagged "share sample values" in the catalog editor). Every statement it produces goes through a sqlglot validator that enforces: single statement, SELECT only, catalog-known identifiers only, no `SELECT *`, and a hard LIMIT of 5,000 rows, before running read-only with a 30s timeout. Details in [docs/architecture.md](docs/architecture.md).

## Connecting a real system

The demo runs through the same `LegacyConnector` interface a real connection would. `DB2ODBCConnector` (pyodbc + IBM i Access ODBC driver) and `SQLServerConnector` (pyodbc + ODBC Driver 18) ship as honest stubs: the connection form works, and adding one surfaces the missing-driver message until the drivers are installed and the stubs completed.
