"""Create and populate demo_mars.db, a SQLite stand-in for MIPROD on DB2/AS400.

Every date is DECIMAL(8,0) CYMD, statuses are single-character codes, and
the distributions are shaped like a real mid-size servicer: mostly active
loans, a renewal wave clustered in 2026, a small default book, and payment
history that loosely tracks the loan balances.
"""

import random
import sqlite3
from datetime import date, timedelta
from pathlib import Path

from .. import config
from ..appdb import make_engine
from ..catalog.dictionary import apply_dictionary, parse_dictionary
from ..catalog.store import CatalogStore
from ..connectors.sqlite_connector import SQLiteConnector
from ..cymd import date_to_cymd
from .make_dictionary import write_dictionary

DEMO_CONNECTION_NAME = "MIPROD demo (DB2/AS400 snapshot)"

DDL = """
CREATE TABLE LNMAST (
  LNNBR   DECIMAL(10,0) PRIMARY KEY,
  LNSTCD  CHAR(1)       NOT NULL,
  LNBAL   DECIMAL(13,2) NOT NULL,
  ORGAMT  DECIMAL(13,2) NOT NULL,
  INTRT   DECIMAL(7,5)  NOT NULL,
  ORGDTE  DECIMAL(8,0)  NOT NULL,
  MTDTE   DECIMAL(8,0)  NOT NULL,
  PRDCD   CHAR(2)       NOT NULL,
  INVCD   CHAR(2)       NOT NULL,
  PYMTAMT DECIMAL(11,2) NOT NULL
);
CREATE TABLE BRWR (
  LNNBR  DECIMAL(10,0) NOT NULL,
  BRSEQ  DECIMAL(3,0)  NOT NULL,
  BRTYP  CHAR(1)       NOT NULL,
  BRFNM  CHAR(20)      NOT NULL,
  BRLNM  CHAR(30)      NOT NULL,
  PRIMARY KEY (LNNBR, BRSEQ)
);
CREATE TABLE PRPTY (
  LNNBR   DECIMAL(10,0) PRIMARY KEY,
  PRVCD   CHAR(2)       NOT NULL,
  CTYNM   CHAR(30)      NOT NULL,
  PSTLCD  CHAR(7)       NOT NULL,
  PRPTYP  CHAR(1)       NOT NULL
);
CREATE TABLE PYHIST (
  LNNBR  DECIMAL(10,0) NOT NULL,
  PYDTE  DECIMAL(8,0)  NOT NULL,
  PYAMT  DECIMAL(11,2) NOT NULL,
  PYTYP  CHAR(1)       NOT NULL
);
CREATE INDEX PYHIST01 ON PYHIST (LNNBR, PYDTE);
CREATE TABLE RNWL (
  LNNBR   DECIMAL(10,0) NOT NULL,
  RNDTE   DECIMAL(8,0)  NOT NULL,
  OFRRT   DECIMAL(7,5)  NOT NULL,
  RNSTCD  CHAR(1)       NOT NULL
);
CREATE TABLE TXARR (
  LNNBR   DECIMAL(10,0) NOT NULL,
  TAXYR   DECIMAL(4,0)  NOT NULL,
  ARRAMT  DECIMAL(11,2) NOT NULL,
  ARRDTE  DECIMAL(8,0)  NOT NULL,
  ARRSTS  CHAR(1)       NOT NULL
);
CREATE TABLE STSCDS (
  CDTYP  CHAR(10) NOT NULL,
  CDVAL  CHAR(4)  NOT NULL,
  CDDSC  CHAR(40) NOT NULL,
  PRIMARY KEY (CDTYP, CDVAL)
);
"""

PRODUCTS = [("F5", 60, 0.45), ("V5", 60, 0.20), ("F3", 36, 0.15), ("HL", 120, 0.12), ("F1", 12, 0.08)]
STATUSES = [("A", 0.85), ("P", 0.09), ("D", 0.04), ("W", 0.02)]
INVESTORS = [("B1", 0.60), ("S1", 0.25), ("S2", 0.15)]
PROVINCES = [
    ("ON", 0.38, "KLMNP", ["TORONTO", "OTTAWA", "HAMILTON", "LONDON", "MISSISSAUGA", "KITCHENER", "WINDSOR", "SUDBURY"]),
    ("QC", 0.21, "GHJ", ["MONTREAL", "QUEBEC", "LAVAL", "GATINEAU", "SHERBROOKE", "TROIS-RIVIERES"]),
    ("BC", 0.16, "V", ["VANCOUVER", "VICTORIA", "SURREY", "KELOWNA", "KAMLOOPS", "NANAIMO"]),
    ("AB", 0.12, "T", ["CALGARY", "EDMONTON", "RED DEER", "LETHBRIDGE", "FORT MCMURRAY"]),
    ("MB", 0.04, "R", ["WINNIPEG", "BRANDON", "STEINBACH"]),
    ("SK", 0.03, "S", ["SASKATOON", "REGINA", "PRINCE ALBERT"]),
    ("NS", 0.03, "B", ["HALIFAX", "DARTMOUTH", "SYDNEY"]),
    ("NB", 0.02, "E", ["MONCTON", "SAINT JOHN", "FREDERICTON"]),
    ("NL", 0.01, "A", ["ST. JOHN'S", "MOUNT PEARL", "CORNER BROOK"]),
]
PROPERTY_TYPES = [("D", 0.52), ("C", 0.22), ("T", 0.16), ("S", 0.10)]

FIRST_NAMES = [
    "JAMES", "MARY", "ROBERT", "PATRICIA", "JOHN", "JENNIFER", "MICHAEL", "LINDA",
    "DAVID", "ELIZABETH", "WILLIAM", "SUSAN", "RICHARD", "JESSICA", "JOSEPH",
    "KAREN", "THOMAS", "NANCY", "PIERRE", "MARIE", "LUC", "SOPHIE", "AMIR",
    "FATIMA", "WEI", "MEI", "RAJ", "PRIYA", "CARLOS", "ANA", "DANIEL", "SARAH",
    "KEVIN", "MICHELLE", "BRIAN", "AMANDA", "GEORGE", "HELEN", "MARK", "LAURA",
]
LAST_NAMES = [
    "SMITH", "BROWN", "TREMBLAY", "MARTIN", "ROY", "WILSON", "MACDONALD",
    "GAGNON", "JOHNSON", "TAYLOR", "CAMPBELL", "ANDERSON", "JONES", "LEBLANC",
    "COTE", "WILLIAMS", "MILLER", "THOMPSON", "GAUTHIER", "WHITE", "LEE",
    "PATEL", "WONG", "SINGH", "CHEN", "KUMAR", "ALI", "KHAN", "MOORE", "CLARK",
    "MORIN", "FORTIN", "STEWART", "BELANGER", "REID", "ROSS", "WALKER", "YOUNG",
    "SCOTT", "KELLY", "MURRAY", "WATSON", "GRAHAM", "MITCHELL", "HAMILTON",
    "LAVOIE", "PEARSON", "GRANT", "DUBOIS", "FRASER", "HENDERSON", "BOUCHARD",
    "SIMPSON", "HUGHES", "ARMSTRONG", "BERGERON", "PELLETIER", "FISHER",
    "GIBSON", "SUTHERLAND",
]

STSCDS_ROWS = [
    ("LNSTCD", "A", "ACTIVE"), ("LNSTCD", "P", "PAID OUT"),
    ("LNSTCD", "D", "DEFAULT"), ("LNSTCD", "W", "WRITTEN OFF"),
    ("BRTYP", "P", "PRIMARY BORROWER"), ("BRTYP", "C", "CO-BORROWER"),
    ("PYTYP", "R", "REGULAR PAYMENT"), ("PYTYP", "P", "PRIVILEGE PREPAYMENT"),
    ("PYTYP", "N", "NSF REVERSAL"),
    ("RNSTCD", "O", "OFFERED"), ("RNSTCD", "A", "ACCEPTED"),
    ("RNSTCD", "D", "DECLINED"), ("RNSTCD", "E", "EXPIRED"),
    ("PRPTYP", "D", "DETACHED"), ("PRPTYP", "S", "SEMI-DETACHED"),
    ("PRPTYP", "T", "TOWNHOUSE"), ("PRPTYP", "C", "CONDOMINIUM"),
    ("PRDCD", "F1", "1 YEAR FIXED"), ("PRDCD", "F3", "3 YEAR FIXED"),
    ("PRDCD", "F5", "5 YEAR FIXED"), ("PRDCD", "V5", "5 YEAR VARIABLE"),
    ("PRDCD", "HL", "HELOC"),
    ("INVCD", "B1", "BALANCE SHEET"), ("INVCD", "S1", "SECURITIZED POOL 1"),
    ("INVCD", "S2", "SECURITIZED POOL 2"),
    ("ARRSTS", "O", "OUTSTANDING"), ("ARRSTS", "P", "PAID"),
    ("PRVCD", "ON", "ONTARIO"), ("PRVCD", "QC", "QUEBEC"),
    ("PRVCD", "BC", "BRITISH COLUMBIA"), ("PRVCD", "AB", "ALBERTA"),
    ("PRVCD", "MB", "MANITOBA"), ("PRVCD", "SK", "SASKATCHEWAN"),
    ("PRVCD", "NS", "NOVA SCOTIA"), ("PRVCD", "NB", "NEW BRUNSWICK"),
    ("PRVCD", "NL", "NEWFOUNDLAND AND LABRADOR"),
]

TODAY = date(2026, 7, 1)


def _weighted(rng, items):
    return rng.choices([i[0] for i in items], weights=[i[-1] for i in items])[0]


def _monthly_payment(principal, annual_rate_pct, amort_months=300):
    r = annual_rate_pct / 100 / 12
    return round(principal * r / (1 - (1 + r) ** -amort_months), 2)


def _postal_code(rng, letters):
    consonants = "BCEGHJKLMNPRSTVWXYZ"
    return (
        f"{rng.choice(letters)}{rng.randint(0, 9)}{rng.choice(consonants)} "
        f"{rng.randint(0, 9)}{rng.choice(consonants)}{rng.randint(0, 9)}"
    )


def _months_between(start: date, end: date):
    current = date(start.year, start.month, 1)
    while current <= end:
        yield current
        current = (
            date(current.year + 1, 1, 1)
            if current.month == 12
            else date(current.year, current.month + 1, 1)
        )


def _make_loan(rng, loan_number):
    product = _weighted(rng, [(p, w) for p, _, w in PRODUCTS])
    term_months = next(t for p, t, _ in PRODUCTS if p == product)
    status = _weighted(rng, STATUSES)

    if status in ("P", "W"):
        maturity = TODAY - timedelta(days=rng.randint(30, 2000))
    elif rng.random() < 0.42:
        # The 2026 renewal wave: a large slice of the book matures this year.
        maturity = date(2026, 1, 1) + timedelta(days=rng.randint(0, 364))
    else:
        maturity = date(2026, 12, 31) + timedelta(days=rng.randint(30, 1800))
    origination = maturity - timedelta(days=int(term_months * 30.44))

    rate_base = {"F1": 5.35, "F3": 4.95, "F5": 4.55, "V5": 5.85, "HL": 6.45}[product]
    rate = round(rate_base + rng.randint(-90, 110) / 100, 5)
    original_amount = rng.randint(90, 950) * 1000
    if status in ("P", "W"):
        balance = 0.0
    elif status == "D":
        balance = round(original_amount * rng.uniform(0.70, 1.00), 2)
    else:
        balance = round(original_amount * rng.uniform(0.55, 0.97), 2)
    return {
        "LNNBR": loan_number,
        "LNSTCD": status,
        "LNBAL": balance,
        "ORGAMT": original_amount,
        "INTRT": rate,
        "ORGDTE": date_to_cymd(origination),
        "MTDTE": date_to_cymd(maturity),
        "PRDCD": product,
        "INVCD": _weighted(rng, INVESTORS),
        "PYMTAMT": _monthly_payment(original_amount, rate),
        "_origination": origination,
        "_maturity": maturity,
    }


def _payment_rows(rng, loan):
    rows = []
    start = max(loan["_origination"], date(2023, 1, 1))
    if loan["LNSTCD"] in ("P", "W"):
        end = min(loan["_maturity"], TODAY)
    elif loan["LNSTCD"] == "D":
        end = start + timedelta(days=rng.randint(90, 600))
    else:
        end = TODAY
    if end < start:
        return rows
    pay_day = rng.randint(1, 28)
    payment = loan["PYMTAMT"]
    for month_start in _months_between(start, end):
        pay_date = month_start.replace(day=pay_day)
        if pay_date > end:
            break
        cymd = date_to_cymd(pay_date)
        if rng.random() < 0.012:
            rows.append((loan["LNNBR"], cymd, payment, "R"))
            rows.append((loan["LNNBR"], cymd, -payment, "N"))
            retry = date_to_cymd(pay_date + timedelta(days=rng.randint(3, 7)))
            rows.append((loan["LNNBR"], retry, payment, "R"))
        else:
            rows.append((loan["LNNBR"], cymd, payment, "R"))
    if loan["LNSTCD"] == "A" and rng.random() < 0.08:
        for _ in range(rng.randint(1, 3)):
            when = start + timedelta(days=rng.randint(0, max((end - start).days, 1)))
            rows.append(
                (loan["LNNBR"], date_to_cymd(when),
                 round(rng.uniform(2000, 30000), 2), "P")
            )
    return rows


def _renewal_rows(rng, loan):
    maturity = loan["_maturity"]
    if not (date(2025, 1, 1) <= maturity <= date(2026, 12, 31)):
        return []
    if loan["LNSTCD"] in ("D", "W"):
        return []
    offer_date = maturity - timedelta(days=rng.randint(90, 150))
    offered_rate = round(4.35 + rng.randint(0, 120) / 100, 5)
    if maturity <= TODAY:
        status = _weighted(rng, [("A", 0.70), ("D", 0.15), ("E", 0.15)])
    else:
        status = _weighted(rng, [("O", 0.60), ("A", 0.30), ("D", 0.10)])
    return [(loan["LNNBR"], date_to_cymd(offer_date), offered_rate, status)]


def _arrears_rows(rng, loans):
    rows = []
    for loan in loans:
        in_default = loan["LNSTCD"] == "D"
        if not (in_default and rng.random() < 0.65) and not rng.random() < 0.015:
            continue
        tax_year = rng.choice([2024, 2025, 2025, 2026])
        recorded = date(tax_year, rng.randint(1, 12), rng.randint(1, 28))
        status = "O" if (in_default or rng.random() < 0.55) else "P"
        rows.append(
            (loan["LNNBR"], tax_year, round(rng.uniform(800, 9500), 2),
             date_to_cymd(recorded), status)
        )
    return rows


def seed_demo_db(db_path: Path, loan_count: int = 3000, rng_seed: int = 20260401) -> dict:
    rng = random.Random(rng_seed)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()
    db = sqlite3.connect(db_path)
    db.executescript(DDL)

    loans = [_make_loan(rng, 7000001 + i) for i in range(loan_count)]
    db.executemany(
        "INSERT INTO LNMAST VALUES (?,?,?,?,?,?,?,?,?,?)",
        [
            (l["LNNBR"], l["LNSTCD"], l["LNBAL"], l["ORGAMT"], l["INTRT"],
             l["ORGDTE"], l["MTDTE"], l["PRDCD"], l["INVCD"], l["PYMTAMT"])
            for l in loans
        ],
    )

    borrower_rows = []
    for loan in loans:
        borrower_rows.append(
            (loan["LNNBR"], 1, "P", rng.choice(FIRST_NAMES), rng.choice(LAST_NAMES))
        )
        if rng.random() < 0.35:
            borrower_rows.append(
                (loan["LNNBR"], 2, "C", rng.choice(FIRST_NAMES), rng.choice(LAST_NAMES))
            )
    db.executemany("INSERT INTO BRWR VALUES (?,?,?,?,?)", borrower_rows)

    property_rows = []
    for loan in loans:
        province, _, letters, cities = PROVINCES[
            rng.choices(range(len(PROVINCES)), weights=[p[1] for p in PROVINCES])[0]
        ]
        property_rows.append(
            (loan["LNNBR"], province, rng.choice(cities),
             _postal_code(rng, letters), _weighted(rng, PROPERTY_TYPES))
        )
    db.executemany("INSERT INTO PRPTY VALUES (?,?,?,?,?)", property_rows)

    payment_rows = []
    for loan in loans:
        payment_rows.extend(_payment_rows(rng, loan))
    db.executemany("INSERT INTO PYHIST VALUES (?,?,?,?)", payment_rows)

    renewal_rows = []
    for loan in loans:
        renewal_rows.extend(_renewal_rows(rng, loan))
    db.executemany("INSERT INTO RNWL VALUES (?,?,?,?)", renewal_rows)

    arrears_rows = _arrears_rows(rng, loans)
    db.executemany("INSERT INTO TXARR VALUES (?,?,?,?,?)", arrears_rows)

    db.executemany("INSERT INTO STSCDS VALUES (?,?,?)", STSCDS_ROWS)
    db.commit()
    db.close()
    return {
        "loans": len(loans),
        "borrowers": len(borrower_rows),
        "payments": len(payment_rows),
        "renewals": len(renewal_rows),
        "arrears": len(arrears_rows),
    }


def bootstrap_app_db(app_db_path: Path, demo_db_path: Path, dictionary_path: Path) -> int:
    """Register the demo connection, introspect it, and apply the dictionary."""
    engine = make_engine(app_db_path)
    store = CatalogStore(engine)
    connection = store.find_connection_by_name(DEMO_CONNECTION_NAME)
    if connection is None:
        connection_id = store.add_connection(
            DEMO_CONNECTION_NAME, "sqlite", str(demo_db_path), is_demo=True
        )
    else:
        connection_id = connection["id"]
    connector = SQLiteConnector(str(demo_db_path))
    store.sync_introspection(connection_id, connector)
    doc = parse_dictionary(dictionary_path.read_bytes(), dictionary_path.name)
    apply_dictionary(store, connection_id, doc)
    engine.dispose()
    return connection_id


def main() -> None:
    write_dictionary(config.DEMO_DICTIONARY_PATH)
    counts = seed_demo_db(config.DEMO_DB_PATH)
    bootstrap_app_db(
        config.APP_DB_PATH, config.DEMO_DB_PATH, config.DEMO_DICTIONARY_PATH
    )
    print(f"Seeded {config.DEMO_DB_PATH}:")
    for name, count in counts.items():
        print(f"  {name}: {count}")
    print(f"Dictionary written to {config.DEMO_DICTIONARY_PATH} and applied.")
    print(f"App state in {config.APP_DB_PATH}.")


if __name__ == "__main__":
    main()
