from app.pipeline.validator import validate_sql


def test_valid_select_passes(schema):
    result = validate_sql(
        "SELECT LNNBR, LNBAL FROM LNMAST WHERE LNSTCD = 'A' LIMIT 100", schema
    )
    assert result.ok
    assert result.error is None


def test_unparseable_sql_rejected(schema):
    result = validate_sql("SELECT FROM WHERE", schema)
    assert not result.ok
    assert "parse" in result.error.lower()


def test_multi_statement_rejected(schema):
    result = validate_sql("SELECT LNNBR FROM LNMAST; SELECT LNNBR FROM LNMAST", schema)
    assert not result.ok
    assert "single statement" in result.error


def test_delete_rejected(schema):
    result = validate_sql("DELETE FROM LNMAST", schema)
    assert not result.ok
    assert "SELECT" in result.error


def test_update_rejected(schema):
    result = validate_sql("UPDATE LNMAST SET LNBAL = 0", schema)
    assert not result.ok


def test_drop_rejected(schema):
    result = validate_sql("DROP TABLE LNMAST", schema)
    assert not result.ok


def test_pragma_rejected(schema):
    result = validate_sql("PRAGMA table_info(LNMAST)", schema)
    assert not result.ok


def test_attach_rejected(schema):
    result = validate_sql("ATTACH DATABASE 'x.db' AS other", schema)
    assert not result.ok


def test_select_hiding_dml_in_statement_list_rejected(schema):
    result = validate_sql("SELECT LNNBR FROM LNMAST; DELETE FROM LNMAST", schema)
    assert not result.ok


def test_unknown_table_named_in_error(schema):
    result = validate_sql("SELECT LNNBR FROM LNXXXX", schema)
    assert not result.ok
    assert "LNXXXX" in result.error


def test_unknown_column_named_in_error(schema):
    result = validate_sql("SELECT MADEUPCOL FROM LNMAST", schema)
    assert not result.ok
    assert "MADEUPCOL" in result.error


def test_unknown_qualified_column_named_in_error(schema):
    result = validate_sql(
        "SELECT L.NOPE FROM LNMAST L JOIN PRPTY P ON P.LNNBR = L.LNNBR", schema
    )
    assert not result.ok
    assert "NOPE" in result.error


def test_select_star_expanded(schema):
    result = validate_sql("SELECT * FROM PRPTY", schema)
    assert result.ok
    assert "*" not in result.sql
    for column in sorted(schema["PRPTY"]):
        assert column in result.sql
    assert any("expanded" in n for n in result.notes)


def test_qualified_star_expanded(schema):
    result = validate_sql(
        "SELECT L.* FROM LNMAST L JOIN PRPTY P ON P.LNNBR = L.LNNBR", schema
    )
    assert result.ok
    assert "*" not in result.sql
    assert "LNSTCD" in result.sql


def test_count_star_is_not_expanded(schema):
    result = validate_sql("SELECT COUNT(*) AS n FROM LNMAST", schema)
    assert result.ok
    assert "COUNT(*)" in result.sql.upper()


def test_limit_injected_when_absent(schema):
    result = validate_sql("SELECT LNNBR FROM LNMAST", schema)
    assert result.ok
    assert "LIMIT 5000" in result.sql
    assert any("added" in n for n in result.notes)


def test_limit_capped_at_5000(schema):
    result = validate_sql("SELECT LNNBR FROM LNMAST LIMIT 999999", schema)
    assert result.ok
    assert "LIMIT 5000" in result.sql
    assert any("capped" in n for n in result.notes)


def test_reasonable_limit_kept(schema):
    result = validate_sql("SELECT LNNBR FROM LNMAST LIMIT 25", schema)
    assert result.ok
    assert "LIMIT 25" in result.sql


def test_group_by_alias_and_aggregate_pass(schema):
    result = validate_sql(
        "SELECT CAST(PYDTE / 100 AS INTEGER) AS pay_month, SUM(PYAMT) AS total "
        "FROM PYHIST WHERE PYTYP = 'P' GROUP BY pay_month ORDER BY pay_month",
        schema,
    )
    assert result.ok


def test_subquery_columns_validated(schema):
    result = validate_sql(
        "SELECT t.LNNBR FROM (SELECT LNNBR FROM LNMAST WHERE LNSTCD = 'A') t",
        schema,
    )
    assert result.ok


def test_subquery_with_unknown_column_rejected(schema):
    result = validate_sql(
        "SELECT t.LNNBR FROM (SELECT LNNBR, GHOST FROM LNMAST) t", schema
    )
    assert not result.ok
    assert "GHOST" in result.error
