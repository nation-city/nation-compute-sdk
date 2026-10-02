/**
 * NATION Compute for JavaScript/TypeScript.
 *
 * NATION Compute is OpenAI-compatible, so this is a thin layer over the official
 * `openai` package: the right base URL, your NATION key from the environment, and
 * a helper for your credit balance. Everything else is the OpenAI SDK you know.
 */
import OpenAI, { type ClientOptions } from "openai";

/** The public NATION Compute endpoint. */
export const NATION_BASE_URL = "https://api.thenation.city/api/v1";
/** Private mode (NATION Incognito) lives under this path; see the `nation-incognito` package. */
export const NATION_INCOGNITO_URL = `${NATION_BASE_URL}/incognito`;

export type NationOptions = Omit<ClientOptions, "baseURL"> & { baseURL?: string };

export class NationCompute extends OpenAI {
  constructor(options: NationOptions = {}) {
    const apiKey = options.apiKey ?? process.env.NATION_API_KEY;
    if (!apiKey) throw new Error("Set NATION_API_KEY (get a key at https://thenation.city) or pass { apiKey }.");
    super({ ...options, apiKey, baseURL: options.baseURL ?? process.env.NATION_BASE_URL ?? NATION_BASE_URL });
  }

  /** Your usable balance, tier and recent receipts (GET /credits). */
  async credits(): Promise<NationCredits> {
    return this.get("/credits");
  }
}

/** The fields most apps need; the API may return more. */
export interface NationCredits {
  balance_usd?: number;
  tier?: string;
  [key: string]: unknown;
}

/** Shortcut: `const nation = createNation()` */
export const createNation = (options?: NationOptions) => new NationCompute(options);

export default NationCompute;
