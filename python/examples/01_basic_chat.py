"""Basic chat: one question, one answer.

    NATION_API_KEY=your_key_here python examples/01_basic_chat.py
"""
import os

from nation_compute import NationCompute

nation = NationCompute()
model = os.environ.get("NATION_MODEL", "anthropic/claude-sonnet-5.5")

reply = nation.chat.completions.create(
    model=model,
    messages=[{"role": "user", "content": "In two sentences, what is a confidential GPU?"}],
    max_tokens=300,
)
print(reply.choices[0].message.content)
print(f"\n({reply.usage.total_tokens if reply.usage else '?'} tokens)")
