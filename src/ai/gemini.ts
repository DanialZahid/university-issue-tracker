import 'server-only';

// Thin client for the Gemini REST API. No SDK: fewer dependencies, no
// tracking headers, and every request is visible here.

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const AI_MODELS = {
  text: process.env['GEMINI_TEXT_MODEL'] ?? 'gemini-3.5-flash-lite',
  embedding: process.env['GEMINI_EMBEDDING_MODEL'] ?? 'gemini-embedding-2',
};

export function isAiConfigured(): boolean {
  return !!process.env['GEMINI_API_KEY'];
}

// Worth retrying later: rate limits (429) and the provider being busy or
// briefly down (500, 503).
export class AiRetryableError extends Error {
  constructor(
    readonly retryAfterMs: number,
    message: string,
  ) {
    super(message);
  }
}

export class AiError extends Error {}

async function call<T>(model: string, method: string, body: unknown) {
  const key = process.env['GEMINI_API_KEY'];
  if (!key) throw new AiError('GEMINI_API_KEY is not set.');

  const res = await fetch(`${BASE}/${model}:${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (res.status === 429 || res.status === 500 || res.status === 503) {
    const seconds = Number(res.headers.get('retry-after'));
    const fallback = res.status === 429 ? 20_000 : 8_000;
    throw new AiRetryableError(
      seconds > 0 ? seconds * 1000 : fallback,
      res.status === 429 ? 'rate limited' : 'model busy',
    );
  }
  if (!res.ok) {
    // The message is from Google, never contains the key, and helps when a
    // model name or field is wrong.
    const detail = await res.text().catch(() => '');
    throw new AiError(`${res.status} from ${model}: ${detail.slice(0, 400)}`);
  }
  return (await res.json()) as T;
}

type GenerateResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

// Asks for JSON that matches the given schema.
export async function generateJson(options: {
  system: string;
  prompt: string;
  schema: object;
}): Promise<unknown> {
  const data = await call<GenerateResponse>(AI_MODELS.text, 'generateContent', {
    systemInstruction: { parts: [{ text: options.system }] },
    contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseJsonSchema: options.schema,
    },
  });
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ??
    '';
  try {
    return JSON.parse(text);
  } catch {
    throw new AiError(`The model did not return JSON: ${text.slice(0, 200)}`);
  }
}

type EmbedResponse = { embedding?: { values?: number[] } };

export async function embed(text: string): Promise<number[]> {
  const data = await call<EmbedResponse>(AI_MODELS.embedding, 'embedContent', {
    content: { parts: [{ text }] },
  });
  const values = data.embedding?.values;
  if (!values?.length) throw new AiError('No embedding returned.');
  return values;
}
