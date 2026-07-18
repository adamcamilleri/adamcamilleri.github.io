"""CYMD date handling.

Legacy AS/400 schemas store dates as DECIMAL(8,0) in CYMD form: 20260331
means 2026-03-31. Zero means "no date". These helpers convert between the
numeric form and Python dates for display and export.
"""

from datetime import date


def cymd_to_date(value):
    """Return the date for a CYMD integer, or None for 0/None/invalid."""
    if value is None:
        return None
    try:
        n = int(value)
    except (TypeError, ValueError):
        return None
    if n <= 0:
        return None
    year, rest = divmod(n, 10000)
    month, day = divmod(rest, 100)
    try:
        return date(year, month, day)
    except ValueError:
        return None


def date_to_cymd(d: date) -> int:
    """Return the CYMD integer for a date."""
    return d.year * 10000 + d.month * 100 + d.day


def cymd_month(value: int) -> int:
    """Return the CYM month key (e.g. 202603) for a CYMD integer."""
    return int(value) // 100


def looks_like_cymd(value) -> bool:
    """True when a value parses as a plausible CYMD date (1900-2100)."""
    d = cymd_to_date(value)
    return d is not None and 1900 <= d.year <= 2100
