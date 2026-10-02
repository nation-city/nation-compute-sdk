"""A simple agent: the model picks a tool, your code runs it, the result goes back.

NATION Compute does not accept OpenAI tool-calling fields, so the agent speaks a
tiny JSON protocol in plain text instead: easy to read and to extend.

    NATION_API_KEY=your_key_here python examples/04_simple_agent.py "What is 17.5% of 2,340?"
"""
import ast
import datetime
import json
import operator
import os
import sys

from nation_compute import NationCompute

_OPS = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.Div: operator.truediv, ast.USub: operator.neg}


def calculate(expression: str) -> float:
    """Safe arithmetic: numbers, + - * / ( ) and % (meaning /100). No eval."""
    tree = ast.parse(expression.replace(",", "").replace("%", "/100"), mode="eval")

    def walk(node: ast.AST) -> float:
        if isinstance(node, ast.Expression):
            return walk(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)) and not isinstance(node.value, bool):
            return float(node.value)
        if isinstance(node, ast.BinOp) and type(node.op) in _OPS:
            return _OPS[type(node.op)](walk(node.left), walk(node.right))
        if isinstance(node, ast.UnaryOp) and type(node.op) in _OPS:
            return _OPS[type(node.op)](walk(node.operand))
        raise ValueError("only numbers and + - * / ( ) % are allowed")

    return round(walk(tree), 9)


TOOLS = {
    "calculator": lambda text: str(calculate(text)),
    "today": lambda _text: datetime.date.today().isoformat(),
}

SYSTEM = f"""You are a careful assistant with tools: {", ".join(TOOLS)}.
calculator takes an arithmetic expression. today takes nothing and returns YYYY-MM-DD.
Reply with ONLY one JSON object per turn:
{{"tool": "<name>", "input": "<text>"}}   to use a tool, or
{{"answer": "<final answer>"}}           when you are done."""


def main() -> None:
    nation = NationCompute()
    model = os.environ.get("NATION_MODEL", "anthropic/claude-sonnet-5.5")
    question = sys.argv[1] if len(sys.argv) > 1 else "What is 17.5% of 2,340, plus today's day of the month?"
    messages = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": question}]
    for step in range(1, 7):
        text = nation.chat.completions.create(model=model, messages=messages, max_tokens=300).choices[0].message.content or ""
        messages.append({"role": "assistant", "content": text})
        try:
            action = json.loads(text[text.index("{"): text.rindex("}") + 1])
        except ValueError:
            messages.append({"role": "user", "content": "Please reply with one JSON object only."})
            continue
        if action.get("answer"):
            print("Answer:", action["answer"])
            return
        tool = TOOLS.get(action.get("tool", ""))
        try:
            result = tool(action.get("input", "")) if tool else f"error: unknown tool {action.get('tool')}"
        except (ValueError, SyntaxError, ZeroDivisionError) as error:
            result = f"error: {error}"
        print(f"step {step}: {action.get('tool')}({action.get('input', '')}) → {result}")
        messages.append({"role": "user", "content": f"Tool result: {result}"})
    print("The agent did not finish in 6 steps.")


if __name__ == "__main__":
    main()
