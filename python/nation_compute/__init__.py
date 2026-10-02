"""NATION Compute for Python.

NATION Compute is OpenAI-compatible, so this is a thin layer over the official
``openai`` package: the right base URL, your NATION key from the environment,
and a helper for your credit balance. Everything else is the OpenAI SDK.
"""
from __future__ import annotations

import os
from typing import Any, Dict, Optional

from openai import AsyncOpenAI, OpenAI

__all__ = ["NATION_BASE_URL", "NATION_INCOGNITO_URL", "NationCompute", "AsyncNationCompute"]
__version__ = "0.1.0"

NATION_BASE_URL = "https://api.thenation.city/api/v1"
"""The public NATION Compute endpoint."""
NATION_INCOGNITO_URL = NATION_BASE_URL + "/incognito"
"""Private mode (NATION Incognito). Needs on-device encryption: use the nation-incognito client."""


def _settings(api_key: Optional[str], base_url: Optional[str]) -> Dict[str, str]:
    key = api_key or os.environ.get("NATION_API_KEY")
    if not key:
        raise ValueError("Set NATION_API_KEY (get a key at https://thenation.city) or pass api_key=...")
    return {"api_key": key, "base_url": base_url or os.environ.get("NATION_BASE_URL") or NATION_BASE_URL}


class NationCompute(OpenAI):
    """An OpenAI client pointed at NATION Compute.

    >>> nation = NationCompute()  # reads NATION_API_KEY
    >>> nation.chat.completions.create(model="anthropic/claude-sonnet-5.5", messages=[...])
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, **kwargs: Any) -> None:
        super().__init__(**_settings(api_key, base_url), **kwargs)

    def credits(self) -> Dict[str, Any]:
        """Your usable balance, tier and recent receipts (GET /credits)."""
        return self.get("/credits", cast_to=object)  # type: ignore[return-value]


class AsyncNationCompute(AsyncOpenAI):
    """The asyncio version of :class:`NationCompute`."""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, **kwargs: Any) -> None:
        super().__init__(**_settings(api_key, base_url), **kwargs)

    async def credits(self) -> Dict[str, Any]:
        return await self.get("/credits", cast_to=object)  # type: ignore[return-value]
