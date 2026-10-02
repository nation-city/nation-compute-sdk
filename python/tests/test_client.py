"""Offline tests: an in-memory transport stands in for the NATION Compute API."""
import importlib.util
import json
import os

try:  # openai v3 uses httpx2; earlier versions use httpx
    import httpx2 as httpx
except ImportError:  # pragma: no cover
    import httpx
import pytest

from nation_compute import NATION_BASE_URL, NationCompute

SEEN = []
HERE = os.path.dirname(__file__)


def handler(request: httpx.Request) -> httpx.Response:
    SEEN.append(request)
    path = request.url.path
    if path.endswith("/models"):
        return httpx.Response(200, json={"object": "list", "data": [{"id": "anthropic/claude-sonnet-5.5", "object": "model", "created": 0, "owned_by": "nation"}]})
    if path.endswith("/credits"):
        return httpx.Response(200, json={"balance_usd": 12.5, "tier": "holder"})
    body = json.loads(request.content)
    if body.get("stream"):
        events = "".join(
            "data: " + json.dumps({"id": "c1", "object": "chat.completion.chunk", "created": 1, "model": body["model"],
                                   "choices": [{"index": 0, "delta": {"content": piece}, "finish_reason": None}]}) + "\n\n"
            for piece in ["Hel", "lo"]
        ) + "data: [DONE]\n\n"
        return httpx.Response(200, text=events, headers={"content-type": "text/event-stream"})
    return httpx.Response(200, json={"id": "c2", "object": "chat.completion", "created": 1, "model": body["model"],
                                     "choices": [{"index": 0, "message": {"role": "assistant", "content": "You asked " + body["model"]}, "finish_reason": "stop"}]})


def client() -> NationCompute:
    return NationCompute(api_key="test_key_placeholder", http_client=httpx.Client(transport=httpx.MockTransport(handler)))


def test_default_endpoint():
    assert NATION_BASE_URL == "https://api.thenation.city/api/v1"
    assert str(client().base_url).rstrip("/") == NATION_BASE_URL


def test_requires_a_key(monkeypatch):
    monkeypatch.delenv("NATION_API_KEY", raising=False)
    with pytest.raises(ValueError, match="NATION_API_KEY"):
        NationCompute()


def test_chat_sends_bearer_key_and_reads_reply():
    reply = client().chat.completions.create(model="anthropic/claude-sonnet-5.5", messages=[{"role": "user", "content": "hi"}])
    assert reply.choices[0].message.content == "You asked anthropic/claude-sonnet-5.5"
    assert SEEN[-1].headers["authorization"] == "Bearer test_key_placeholder"
    assert SEEN[-1].url.path == "/api/v1/chat/completions"


def test_streaming():
    stream = client().chat.completions.create(model="m", messages=[{"role": "user", "content": "hi"}], stream=True)
    assert "".join(c.choices[0].delta.content or "" for c in stream if c.choices) == "Hello"


def test_models_and_credits():
    assert [m.id for m in client().models.list()] == ["anthropic/claude-sonnet-5.5"]
    assert client().credits()["balance_usd"] == 12.5


def test_agent_calculator_is_safe():
    spec = importlib.util.spec_from_file_location("agent", os.path.join(HERE, "..", "examples", "04_simple_agent.py"))
    agent = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(agent)
    assert agent.calculate("17.5% * 2,340 + 2") == 411.5
    with pytest.raises(ValueError):
        agent.calculate("__import__('os').system('echo hi')")
