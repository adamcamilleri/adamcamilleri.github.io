import pytest

from app.appdb import make_engine
from app.catalog.store import CatalogStore


@pytest.fixture
def schema():
    return {
        "LNMAST": {"LNNBR", "LNSTCD", "LNBAL", "INTRT", "MTDTE", "ORGDTE", "PRDCD", "INVCD"},
        "PRPTY": {"LNNBR", "PRVCD", "CTYNM", "PSTLCD", "PRPTYP"},
        "PYHIST": {"LNNBR", "PYDTE", "PYAMT", "PYTYP"},
    }


@pytest.fixture
def store(tmp_path):
    engine = make_engine(tmp_path / "app.db")
    yield CatalogStore(engine)
    engine.dispose()
