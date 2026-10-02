<p align="center">
  <img src="assets/nation-logo.svg" alt="NATION" width="300">
</p>

<h1 align="center">NATION Compute SDK</h1>

<p align="center"><b>One API key. Many AI models. Pay with compute credits.</b><br>
The NATION Compute API is OpenAI-compatible: if you've used the OpenAI SDK, you already know how to use it.</p>

<p align="center"><a href="https://thenation.city"><b>Get an API key → thenation.city</b></a></p>

---

## Quickstart (under 5 minutes)

**1. Get a key** at [thenation.city](https://thenation.city) and keep it in an environment variable. Never paste it into code.

```bash
export NATION_API_KEY=your_key_here
```

**2. Install.** Use the official OpenAI SDK. This repo adds a few conveniences on top of it.

```bash
npm install openai          # JavaScript / TypeScript
pip install openai          # Python
```

**3. Make your first call.**

<details open><summary><b>JavaScript / TypeScript</b></summary>

```ts
import OpenAI from "openai";

const nation = new OpenAI({
  baseURL: "https://api.thenation.city/api/v1",
  apiKey: process.env.NATION_API_KEY,
});

const reply = await nation.chat.completions.create({
  model: "anthropic/claude-sonnet-5.5",
  messages: [{ role: "user", content: "Hello, NATION!" }],
});
console.log(reply.choices[0].message.content);
```
</details>

<details open><summary><b>Python</b></summary>

```python
import os
from openai import OpenAI

nation = OpenAI(base_url="https://api.thenation.city/api/v1", api_key=os.environ["NATION_API_KEY"])

reply = nation.chat.completions.create(
    model="anthropic/claude-sonnet-5.5",
    messages=[{"role": "user", "content": "Hello, NATION!"}],
)
print(reply.choices[0].message.content)
```
</details>

<details><summary><b>curl</b></summary>

```bash
curl https://api.thenation.city/api/v1/chat/completions \
  -H "Authorization: Bearer $NATION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"anthropic/claude-sonnet-5.5","messages":[{"role":"user","content":"Hello, NATION!"}]}'
```
</details>

That's it. Any tool that lets you set an OpenAI "base URL" (agent frameworks, IDE plugins, LangChain, LlamaIndex…) works the same way. Point it at `https://api.thenation.city/api/v1` and use your NATION key.

## The SDK helpers (optional)

The `js/` and `python/` folders are tiny wrappers around the official SDKs. They set the base URL for you, read `NATION_API_KEY`, and add `credits()`:

```ts
import { createNation } from "./js/src/index.ts";
const nation = createNation();                 // reads NATION_API_KEY
console.log(await nation.credits());           // your balance and tier
```

```python
from nation_compute import NationCompute
nation = NationCompute()                       # reads NATION_API_KEY
print(nation.credits())
```

## Examples

| | JavaScript (`js/examples`) | Python (`python/examples`) |
| --- | --- | --- |
| Basic chat | `01-basic-chat.ts` | `01_basic_chat.py` |
| Streaming, word by word | `02-streaming.ts` | `02_streaming.py` |
| Switching models with the same key | `03-switch-models.ts` | `03_switch_models.py` |
| A simple agent that uses tools | `04-simple-agent.ts` | `04_simple_agent.py` |
| Incognito (end-to-end encrypted) | `05-incognito.ts` | Use the JS example or the `nation-incognito` CLI |

```bash
cd js && npm install
NATION_API_KEY=your_key_here node examples/01-basic-chat.ts      # Node 22.18+

cd python && pip install -e .
NATION_API_KEY=your_key_here python examples/01_basic_chat.py
```

## Models

One key works across every model on your account. List them live:

```ts
for await (const model of nation.models.list()) console.log(model.id);
```

Model ids look like `anthropic/claude-sonnet-5.5` or `anthropic/claude-opus-5.5`. The live list is always the source of truth, and `GET /models` also shows each model's per-token prices and context length.

## Incognito mode (private, end-to-end encrypted)

With Incognito, your prompt is **encrypted on your own device**, NATION only relays ciphertext, and it is decrypted only inside a hardware-attested enclave where the model runs. Your device checks the enclave's hardware attestation before sending. It checks a signed receipt before trusting the reply.

- Turn on **Private mode** for your key in the NATION Compute console.
- Regular OpenAI SDKs can't do the encryption, so use NATION's open-source [`nation-incognito`](https://www.npmjs.com/package/nation-incognito) client:

```bash
export NATION_API_KEY=your_key_here
export NATION_BASE_URL=https://api.thenation.city/api/v1/incognito
npx nation-incognito doctor                       # verifies the enclave
echo "my private question" | npx nation-incognito request --max-tokens 400
```

See `js/examples/05-incognito.ts` for the library version, and the **nation-incognito-client** repository for the encryption code and an honest explanation of what it does and doesn't protect.

## Pricing and credits

- You pay with **compute credits**. Each request is charged by the tokens it actually uses. Your balance is shown in `credits()` (`GET /credits`), and non-streamed replies show the charge in `usage`.
- **NATION holders get lower pricing** on compute credits. See [thenation.city](https://thenation.city) for current rates.

## Good to know

- Errors use OpenAI's format. `402` means your balance can't cover the request. `429` means slow down; it includes `Retry-After`.
- `max_tokens` is capped at each model's limit. If you leave it out, the gateway picks a safe default that your balance can cover.
- OpenAI-style tool calling, images and `n > 1` aren't accepted yet (you get a clear `400`). The agent example shows a simple pattern that works today.
- Every response has an `x-request-id` header. Quote it if you ever need support.

## Security

Never commit your API key. This repo only ever uses `your_key_here` placeholders, and `.env` files are ignored. To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
