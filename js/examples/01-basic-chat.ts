// Basic chat: one question, one answer.
//   NATION_API_KEY=your_key_here node examples/01-basic-chat.ts
import { createNation } from "../src/index.ts";

const nation = createNation();
const model = process.env.NATION_MODEL ?? "anthropic/claude-sonnet-5.5";

const reply = await nation.chat.completions.create({
  model,
  messages: [{ role: "user", content: "In two sentences, what is a confidential GPU?" }],
  max_tokens: 300,
});

console.log(reply.choices[0]?.message.content);
console.log(`\n(${reply.usage?.total_tokens ?? "?"} tokens)`);
