// Switching models: the same key and the same code work with every model.
// Lists the live catalogue, then asks the same question to two models.
//   NATION_API_KEY=your_key_here node examples/03-switch-models.ts
import { createNation } from "../src/index.ts";

const nation = createNation();

const available: string[] = [];
for await (const model of nation.models.list()) available.push(model.id);
console.log(`${available.length} models on this key:\n  ${available.join("\n  ")}\n`);

// Pick two (or set NATION_MODELS=a,b to choose).
const chosen = process.env.NATION_MODELS?.split(",").map(m => m.trim()).filter(Boolean) ?? available.slice(0, 2);
for (const model of chosen) {
  const started = Date.now();
  const reply = await nation.chat.completions.create({
    model,
    messages: [{ role: "user", content: "Name one surprising fact about octopuses. One sentence." }],
    max_tokens: 120,
  });
  console.log(`— ${model} (${Date.now() - started} ms)\n${reply.choices[0]?.message.content}\n`);
}
