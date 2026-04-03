"""
Ontario Housing Market - Data Preparation Pipeline
===================================================
This script cleans raw TRREB and StatsCan CSV exports,
engineers features, and outputs the processed JSON
consumed by the dashboard.

Pipeline steps:
  1. Load raw CSVs (sales transactions, listings, census income)
  2. Clean & validate (drop nulls, fix types, remove outliers)
  3. Compute monthly aggregates by city and property type
  4. Calculate derived metrics (YoY change, list-to-sale ratio, DOM)
  5. Export to processed JSON for the web dashboard

Requirements:
  pip install pandas numpy
"""

import json
from pathlib import Path

import numpy as np
import pandas as pd


# ── Config ──────────────────────────────────────────────
RAW_DIR = Path("data/raw")
OUTPUT_PATH = Path("data/processed.json")

CITIES = [
    "Toronto", "Mississauga", "Brampton", "Milton", "Oakville",
    "Burlington", "Hamilton", "Markham", "Vaughan", "Richmond Hill",
]

PROPERTY_TYPES = ["Detached", "Semi-Detached", "Townhouse", "Condo"]


# ── Step 1: Load ────────────────────────────────────────
def load_sales(path: Path) -> pd.DataFrame:
    """Load raw sales transactions CSV."""
    df = pd.read_csv(path, parse_dates=["sale_date", "list_date"])
    print(f"Loaded {len(df):,} sales records")
    return df


def load_income(path: Path) -> pd.DataFrame:
    """Load StatsCan census median household income."""
    return pd.read_csv(path)


# ── Step 2: Clean ───────────────────────────────────────
def clean_sales(df: pd.DataFrame) -> pd.DataFrame:
    """Validate types, drop nulls, remove outlier prices."""
    initial = len(df)

    # Drop rows missing critical fields
    df = df.dropna(subset=["sale_price", "city", "sale_date"])

    # Ensure numeric
    df["sale_price"] = pd.to_numeric(df["sale_price"], errors="coerce")
    df["list_price"] = pd.to_numeric(df["list_price"], errors="coerce")

    # Remove extreme outliers (likely data errors)
    df = df[
        (df["sale_price"] >= 100_000) & (df["sale_price"] <= 10_000_000)
    ]

    # Standardize city names
    df["city"] = df["city"].str.strip().str.title()
    df = df[df["city"].isin(CITIES)]

    # Calculate days on market
    if "days_on_market" not in df.columns:
        df["days_on_market"] = (df["sale_date"] - df["list_date"]).dt.days
    df["days_on_market"] = df["days_on_market"].clip(lower=0, upper=365)

    # List-to-sale ratio
    mask = df["list_price"] > 0
    df.loc[mask, "list_to_sale"] = df.loc[mask, "sale_price"] / df.loc[mask, "list_price"]
    df["list_to_sale"] = df["list_to_sale"].clip(0.7, 1.4)

    print(f"Cleaned: {initial:,} -> {len(df):,} records ({initial - len(df):,} dropped)")
    return df


# ── Step 3: Aggregate ──────────────────────────────────
def monthly_aggregates(df: pd.DataFrame) -> pd.DataFrame:
    """Compute monthly stats by city."""
    df["month"] = df["sale_date"].dt.to_period("M").astype(str)

    agg = (
        df.groupby(["month", "city"])
        .agg(
            avg_price=("sale_price", "mean"),
            median_price=("sale_price", "median"),
            sales=("sale_price", "count"),
            avg_dom=("days_on_market", "mean"),
            list_to_sale=("list_to_sale", "mean"),
        )
        .reset_index()
    )

    # Round for readability
    agg["avg_price"] = agg["avg_price"].round(0).astype(int)
    agg["median_price"] = agg["median_price"].round(0).astype(int)
    agg["avg_dom"] = agg["avg_dom"].round(0).astype(int)
    agg["list_to_sale"] = agg["list_to_sale"].round(3)

    return agg


def by_property_type(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate by city, month, and property type."""
    df["month"] = df["sale_date"].dt.to_period("M").astype(str)

    agg = (
        df.groupby(["month", "city", "property_type"])
        .agg(avg_price=("sale_price", "mean"), sales=("sale_price", "count"))
        .reset_index()
    )

    agg["avg_price"] = agg["avg_price"].round(0).astype(int)
    return agg


# ── Step 4: Derived metrics ────────────────────────────
def add_yoy_change(df: pd.DataFrame) -> pd.DataFrame:
    """Add year-over-year price change percentage."""
    df["month_dt"] = pd.to_datetime(df["month"])
    df["prev_year"] = (df["month_dt"] - pd.DateOffset(years=1)).dt.to_period("M").astype(str)

    prev = df[["month", "city", "avg_price"]].rename(
        columns={"month": "prev_year", "avg_price": "prev_price"}
    )

    df = df.merge(prev, on=["prev_year", "city"], how="left")
    df["yoy_change"] = ((df["avg_price"] - df["prev_price"]) / df["prev_price"] * 100).round(1)

    df = df.drop(columns=["month_dt", "prev_year", "prev_price"])
    return df


# ── Step 5: Export ──────────────────────────────────────
def export_json(monthly: pd.DataFrame, by_type: pd.DataFrame, output: Path):
    """Write processed data to JSON for the dashboard."""
    result = {
        "generated": pd.Timestamp.now().isoformat(),
        "cities": sorted(monthly["city"].unique().tolist()),
        "months": sorted(monthly["month"].unique().tolist()),
        "monthly": monthly.to_dict(orient="records"),
        "by_type": by_type.to_dict(orient="records"),
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    with open(output, "w") as f:
        json.dump(result, f, indent=2)

    size_mb = output.stat().st_size / 1_048_576
    print(f"Exported to {output} ({size_mb:.1f} MB)")


# ── Main ────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("Ontario Housing Market - Data Pipeline")
    print("=" * 60)

    # Load
    sales = load_sales(RAW_DIR / "trreb_sales_2019_2026.csv")

    # Clean
    sales = clean_sales(sales)

    # Aggregate
    monthly = monthly_aggregates(sales)
    typed = by_property_type(sales)

    # Derived metrics
    monthly = add_yoy_change(monthly)

    # Export
    export_json(monthly, typed, OUTPUT_PATH)

    print("\nDone. Dashboard data is ready.")


if __name__ == "__main__":
    main()
