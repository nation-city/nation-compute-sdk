// Streaming: print the answer word by word as it is generated.
//   NATION_API_KEY=your_key_here node examples/02-streaming.ts
import { createNation } from "../src/index.ts";

const nation = createNation();
const model = process.env.NATION_MODEL ?? "anthropic/claude-sonnet-5.5";

const stream = await nation.chat.completions.create({
  model,
  messages: [{ role: "user", content: "Write a four-line poem about a city that never sleeps." }],
  max_tokens: 400,
  stream: true,
  stream_options: { include_usage: true },
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content ?? "");
  if (chunk.usage) console.log(`\n\n(${chunk.usage.total_tokens} tokens)`);
}
