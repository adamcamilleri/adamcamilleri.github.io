from datetime import date

from app.cymd import cymd_month, cymd_to_date, date_to_cymd, looks_like_cymd


def test_cymd_to_date_parses_valid_values():
    assert cymd_to_date(20260331) == date(2026, 3, 31)
    assert cymd_to_date(19991201) == date(1999, 12, 1)


def test_cymd_to_date_rejects_invalid_values():
    assert cymd_to_date(0) is None
    assert cymd_to_date(None) is None
    assert cymd_to_date(20261332) is None
    assert cymd_to_date(20260230) is None
    assert cymd_to_date("not a date") is None


def test_date_to_cymd_roundtrip():
    d = date(2026, 7, 17)
    assert cymd_to_date(date_to_cymd(d)) == d
    assert date_to_cymd(d) == 20260717


def test_cymd_month_key():
    assert cymd_month(20260331) == 202603


def test_looks_like_cymd_bounds():
    assert looks_like_cymd(20260101)
    assert not looks_like_cymd(12345)
    assert not looks_like_cymd(99991231)
