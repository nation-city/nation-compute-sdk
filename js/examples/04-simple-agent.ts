// A simple agent: the model decides which tool to use, your code runs it, and
// the result goes back to the model until it can answer.
// NATION Compute does not accept OpenAI tool-calling fields, so the agent speaks
// a tiny JSON protocol in plain text instead: easy to read and to extend.
//   NATION_API_KEY=your_key_here node examples/04-simple-agent.ts "What is 17.5% of 2,340, plus today's day of the month?"
import { createNation } from "../src/index.ts";
import { calculate } from "./calculator.ts";

const nation = createNation();
const model = process.env.NATION_MODEL ?? "anthropic/claude-sonnet-5.5";
const question = process.argv[2] ?? "What is 17.5% of 2,340, plus today's day of the month?";

// Your tools: plain functions. Add your own.
const tools: Record<string, (input: string) => string> = {
  calculator: (expression) => { try { return String(calculate(expression)); } catch (error) { return `error: ${(error as Error).message}`; } },
  today: () => new Date().toISOString().slice(0, 10),
};

const system = `You are a careful assistant with tools: ${Object.keys(tools).join(", ")}.
calculator takes an arithmetic expression (numbers, + - * / ( ) and %). today takes nothing and returns YYYY-MM-DD.
Reply with ONLY one JSON object per turn:
{"tool": "<name>", "input": "<text>"}   to use a tool, or
{"answer": "<final answer>"}           when you are done.`;

const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
  { role: "system", content: system },
  { role: "user", content: question },
];

for (let step = 1; step <= 6; step++) {
  const reply = await nation.chat.completions.create({ model, messages, max_tokens: 300 });
  const text = reply.choices[0]?.message.content ?? "";
  messages.push({ role: "assistant", content: text });
  let action: { tool?: string; input?: string; answer?: string };
  try { action = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)); }
  catch { messages.push({ role: "user", content: "Please reply with one JSON object only." }); continue; }
  if (action.answer) { console.log(`Answer: ${action.answer}`); process.exit(0); }
  const tool = action.tool ? tools[action.tool] : undefined;
  const result = tool ? tool(action.input ?? "") : `error: unknown tool ${action.tool}`;
  console.log(`step ${step}: ${action.tool}(${action.input ?? ""}) → ${result}`);
  messages.push({ role: "user", content: `Tool result: ${result}` });
}
console.log("The agent did not finish in 6 steps.");
