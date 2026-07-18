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
