"""Thin Anthropic Messages API client.

The rest of the app treats generation as a function of (system, messages).
When ANTHROPIC_API_KEY is missing, LLMUnavailable carries a message the UI
shows as a banner; catalog browsing, manual SQL, and export keep working.
"""

import os

import httpx

from ..config import ANTHROPIC_MODEL

API_URL = "https://api.anthropic.com/v1/messages"
API_VERSION = "2023-06-01"


class LLMUnavailable(Exception):
    pass


class LLMError(Exception):
    pass


def complete(system: str, messages: list[dict], max_tokens: int = 2000) -> str:
    """Send a Messages API request and return the concatenated text blocks."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise LLMUnavailable(
            "ANTHROPIC_API_KEY is not set. Generation is unavailable; you can "
            "still browse the catalog, write SQL by hand, and export results."
        )
    try:
        response = httpx.post(
            API_URL,
            headers={
                "x-api-key": api_key,
                "anthropic-version": API_VERSION,
                "content-type": "application/json",
            },
            json={
                "model": ANTHROPIC_MODEL,
                "max_tokens": max_tokens,
                "system": system,
                "messages": messages,
            },
            timeout=90.0,
        )
    except httpx.HTTPError as e:
        raise LLMError(f"Could not reach the Anthropic API: {e}")
    if response.status_code != 200:
        detail = ""
        try:
            detail = response.json().get("error", {}).get("message", "")
        except ValueError:
            pass
        raise LLMError(f"Anthropic API returned {response.status_code}: {detail}")
    blocks = response.json().get("content", [])
    return "".join(b.get("text", "") for b in blocks if b.get("type") == "text")
