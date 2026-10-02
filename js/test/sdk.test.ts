// Offline tests: a tiny local stand-in for the NATION Compute API checks what the
// SDK sends and that it reads replies, streams and credits correctly.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type IncomingMessage } from "node:http";
import { NATION_BASE_URL, NationCompute, createNation } from "../src/index.ts";
import { calculate } from "../examples/calculator.ts";

const seen: { method: string; url: string; auth: string; body: unknown }[] = [];
const server = createServer(async (req: IncomingMessage, res) => {
  let raw = ""; for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : null;
  seen.push({ method: req.method!, url: req.url!, auth: String(req.headers.authorization), body });
  res.setHeader("content-type", "application/json");
  if (req.url === "/api/v1/models") return res.end(JSON.stringify({ object: "list", data: [{ id: "anthropic/claude-sonnet-5.5", object: "model" }, { id: "anthropic/claude-opus-5.5", object: "model" }] }));
  if (req.url === "/api/v1/credits") return res.end(JSON.stringify({ balance_usd: 12.5, tier: "holder" }));
  if (req.url === "/api/v1/chat/completions" && body?.stream) {
    res.setHeader("content-type", "text/event-stream");
    for (const piece of ["Hel", "lo"]) res.write(`data: ${JSON.stringify({ id: "c1", object: "chat.completion.chunk", created: 1, model: body.model, choices: [{ index: 0, delta: { content: piece }, finish_reason: null }] })}\n\n`);
    return res.end("data: [DONE]\n\n");
  }
  if (req.url === "/api/v1/chat/completions") return res.end(JSON.stringify({ id: "c2", object: "chat.completion", created: 1, model: body.model, choices: [{ index: 0, message: { role: "assistant", content: `You asked ${body.model}` }, finish_reason: "stop" }], usage: { prompt_tokens: 3, completion_tokens: 4, total_tokens: 7 } }));
  res.statusCode = 404; res.end(JSON.stringify({ error: { message: "not found" } }));
});
await new Promise<void>((resolve) => server.listen(0, resolve));
const port = (server.address() as { port: number }).port;
const local = (key = "test_key_placeholder") => new NationCompute({ apiKey: key, baseURL: `http://localhost:${port}/api/v1` });
after(() => server.close());

test("defaults to the public NATION Compute endpoint", () => {
  const nation = createNation({ apiKey: "test_key_placeholder" });
  assert.equal(nation.baseURL, NATION_BASE_URL);
  assert.equal(NATION_BASE_URL, "https://api.thenation.city/api/v1");
});

test("refuses to start without a key", () => {
  const saved = process.env.NATION_API_KEY; delete process.env.NATION_API_KEY;
  try { assert.throws(() => createNation(), /NATION_API_KEY/); } finally { if (saved) process.env.NATION_API_KEY = saved; }
});

test("chat completion sends the key as a Bearer token and reads the reply", async () => {
  const reply = await local().chat.completions.create({ model: "anthropic/claude-sonnet-5.5", messages: [{ role: "user", content: "hi" }], max_tokens: 10 });
  assert.equal(reply.choices[0]?.message.content, "You asked anthropic/claude-sonnet-5.5");
  const last = seen.at(-1)!;
  assert.equal(last.url, "/api/v1/chat/completions");
  assert.equal(last.auth, "Bearer test_key_placeholder");
});

test("streaming yields the text piece by piece", async () => {
  const stream = await local().chat.completions.create({ model: "anthropic/claude-opus-5.5", messages: [{ role: "user", content: "hi" }], stream: true });
  let text = ""; for await (const chunk of stream) text += chunk.choices[0]?.delta?.content ?? "";
  assert.equal(text, "Hello");
});

test("model list and credits", async () => {
  const ids: string[] = []; for await (const model of local().models.list()) ids.push(model.id);
  assert.deepEqual(ids, ["anthropic/claude-sonnet-5.5", "anthropic/claude-opus-5.5"]);
  const credits = await local().credits();
  assert.equal(credits.balance_usd, 12.5);
});

test("the agent example's calculator is exact and refuses code", () => {
  assert.equal(calculate("17.5% * 2,340 + 2"), 411.5);
  assert.equal(calculate("(1 + 2) * -3"), -9);
  assert.throws(() => calculate("process.exit()"), /unexpected/);
});
