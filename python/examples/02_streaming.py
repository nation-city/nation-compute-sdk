"""Streaming: print the answer as it is generated.

    NATION_API_KEY=your_key_here python examples/02_streaming.py
"""
import os

from nation_compute import NationCompute

nation = NationCompute()
model = os.environ.get("NATION_MODEL", "anthropic/claude-sonnet-5.5")

stream = nation.chat.completions.create(
    model=model,
    messages=[{"role": "user", "content": "Write a four-line poem about a city that never sleeps."}],
    max_tokens=400,
    stream=True,
    stream_options={"include_usage": True},
)
for chunk in stream:
    if chunk.choices and chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
    if chunk.usage:
        print(f"\n\n({chunk.usage.total_tokens} tokens)")
