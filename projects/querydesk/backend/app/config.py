import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("QUERYDESK_DATA_DIR", str(BACKEND_DIR / "data")))
APP_DB_PATH = DATA_DIR / "app.db"
DEMO_DB_PATH = DATA_DIR / "demo_mars.db"
DEMO_DICTIONARY_PATH = BACKEND_DIR / "demo_dictionary.xlsx"

ROW_LIMIT = 5000
QUERY_TIMEOUT_S = 30

ANTHROPIC_MODEL = "claude-sonnet-4-6"

# Built frontend served by FastAPI in production deploys; absent in local
# dev, where vite serves the app itself.
STATIC_DIR = Path(
    os.environ.get("QUERYDESK_STATIC_DIR", str(BACKEND_DIR.parent / "frontend" / "dist"))
)

# Generation calls spend real API credits, so the public deploy caps them
# per client IP per hour. Zero disables the limit.
ASK_LIMIT_PER_HOUR = int(os.environ.get("QUERYDESK_ASK_LIMIT_PER_HOUR", "20"))
