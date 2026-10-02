"""Switching models: the same key and the same code work with every model.

    NATION_API_KEY=your_key_here python examples/03_switch_models.py
"""
import os
import time

from nation_compute import NationCompute

nation = NationCompute()
available = [model.id for model in nation.models.list()]
print(f"{len(available)} models on this key:\n  " + "\n  ".join(available) + "\n")

chosen = [m.strip() for m in os.environ.get("NATION_MODELS", "").split(",") if m.strip()] or available[:2]
for model in chosen:
    started = time.time()
    reply = nation.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": "Name one surprising fact about octopuses. One sentence."}],
        max_tokens=120,
    )
    print(f"— {model} ({(time.time() - started) * 1000:.0f} ms)\n{reply.choices[0].message.content}\n")
