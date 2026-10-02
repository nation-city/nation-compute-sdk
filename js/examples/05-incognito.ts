// Incognito (private mode): your prompt is encrypted on this machine to a
// hardware-attested enclave, NATION only relays ciphertext, and the reply is
// checked against a signed receipt before you read it.
// Plain OpenAI clients cannot encrypt, so this uses NATION's `nation-incognito`
// library (open source: see the nation-incognito-client repository).
//
// Turn on "Private mode" for your key in the NATION Compute console first.
//   NATION_API_KEY=your_key_here node examples/05-incognito.ts
import { createIncognitoClient } from "nation-incognito";
import { NATION_INCOGNITO_URL } from "../src/index.ts";

const apiKey = process.env.NATION_API_KEY;
if (!apiKey) throw new Error("Set NATION_API_KEY");

const client = createIncognitoClient({
  gatewayURL: NATION_INCOGNITO_URL,
  headers: { Authorization: `Bearer ${apiKey}` },
});

const models = await client.models();
const model = process.env.NATION_INCOGNITO_MODEL ?? models[0]?.id;
if (!model) throw new Error("No private (attested) models are available on this key.");

const result = await client.chat({
  model,
  messages: [{ role: "user", content: "Give me three questions to ask before signing a lease." }],
  maxTokens: 400,
  requireVerified: true, // refuse to return a reply whose receipt does not check out
  onStep: (s) => s.status !== "active" && console.error(`  ${s.status === "done" ? "✓" : "✗"} ${s.step}${s.detail ? ` — ${s.detail}` : ""}`),
});

console.log(`\n${result.text}\n`);
console.log(`Receipt ${result.receiptId}: ${result.audit?.verified ? "verified" : "not verified"}`);
