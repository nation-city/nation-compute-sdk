/** A tiny, safe arithmetic evaluator for the agent example: numbers, + - * / ( ) and % (meaning "/100"). No eval. */
export function calculate(expression: string): number {
  const tokens = expression.replace(/,/g, "").match(/\d+(?:\.\d+)?|[-+*/()%]/g) ?? [];
  let i = 0;
  const peek = () => tokens[i];
  const next = () => tokens[i++];
  const percent = (value: number) => (peek() === "%" ? (next(), value / 100) : value);
  const factor = (): number => {
    const token = next();
    if (token === "-") return -factor();
    if (token === "(") {
      const value = sum();
      if (next() !== ")") throw new Error("missing )");
      return percent(value);
    }
    if (token !== undefined && /^\d/.test(token)) return percent(Number(token));
    throw new Error(`unexpected ${token ?? "end of expression"}`);
  };
  const product = (): number => {
    let value = factor();
    while (peek() === "*" || peek() === "/") value = next() === "*" ? value * factor() : value / factor();
    return value;
  };
  const sum = (): number => {
    let value = product();
    while (peek() === "+" || peek() === "-") value = next() === "+" ? value + product() : value - product();
    return value;
  };
  const value = sum();
  if (i < tokens.length) throw new Error(`unexpected ${tokens[i]}`);
  return Math.round(value * 1e9) / 1e9;
}
