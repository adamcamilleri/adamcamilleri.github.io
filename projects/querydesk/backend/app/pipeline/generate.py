"""Request text -> validated SQL, with one automatic repair attempt."""

import json
import re

from ..catalog.store import CatalogStore
from ..connectors.base import LegacyConnector
from . import llm
from .prompt import build_system_prompt, build_user_message
from .validator import validate_sql


class GenerationError(Exception):
    pass


def generate_sql(
    store: CatalogStore,
    connection_id: int,
    connector: LegacyConnector,
    request_text: str,
    complete=llm.complete,
) -> dict:
    """Run the generate -> validate -> repair pipeline.

    Returns {ok, sql, explanation, notes, attempts} where attempts lists
    every validation failure that occurred. The `complete` parameter exists
    so tests can run the pipeline without the Anthropic API.
    """
    system = build_system_prompt(store, connection_id, connector)
    schema = store.schema_map(connection_id)
    messages = [{"role": "user", "content": build_user_message(request_text)}]

    reply = complete(system, messages)
    sql, explanation = _parse_reply(reply)
    result = validate_sql(sql, schema)
    attempts = []
    if not result.ok:
        attempts.append(result.error)
        messages.append({"role": "assistant", "content": reply})
        messages.append(
            {
                "role": "user",
                "content": (
                    f"That SQL failed validation: {result.error}\n"
                    "Correct the query using only catalog tables and columns, "
                    "and respond with the same JSON format."
                ),
            }
        )
        reply = complete(system, messages)
        sql, explanation = _parse_reply(reply)
        result = validate_sql(sql, schema)
        if not result.ok:
            attempts.append(result.error)
            return {
                "ok": False,
                "sql": sql,
                "explanation": explanation,
                "notes": [],
                "attempts": attempts,
            }
    return {
        "ok": True,
        "sql": result.sql,
        "explanation": explanation,
        "notes": result.notes,
        "attempts": attempts,
    }


def _parse_reply(reply: str) -> tuple[str, str]:
    text = reply.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    else:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end > start:
            text = text[start : end + 1]
    try:
        data = json.loads(text)
    except ValueError:
        raise GenerationError(
            "The model reply was not the expected JSON with sql and explanation"
        )
    sql = (data.get("sql") or "").strip()
    if not sql:
        raise GenerationError("The model reply contained no SQL")
    return sql, (data.get("explanation") or "").strip()
