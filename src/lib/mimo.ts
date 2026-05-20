/**
 * MiMo client — server-side only. Uses MIMO_API_KEY env var.
 *
 * Token Plan keys (`tp-...`) hit token-plan-sgp.xiaomimimo.com for chat + multimodal.
 * Standard PAYG keys hit api.xiaomimimo.com for everything (incl. /audio/*).
 *
 * This module picks the right base URL per request and degrades gracefully
 * when an audio route is called with a `tp-` key (returns null instead of
 * crashing the request — UI shows a "read it yourself" fallback).
 */

const TOKEN_PLAN_BASE = "https://token-plan-sgp.xiaomimimo.com/v1";
const STANDARD_BASE = "https://api.xiaomimimo.com/v1";

function getKey(): string {
  const k = process.env.MIMO_API_KEY;
  if (!k) throw new Error("MIMO_API_KEY not set");
  return k;
}

function isTokenPlan(key: string): boolean {
  return key.startsWith("tp-");
}

function chatBase(): string {
  return isTokenPlan(getKey()) ? TOKEN_PLAN_BASE : STANDARD_BASE;
}

function audioBase(): string | null {
  // /v1/audio/* routes are only on the Standard endpoint.
  return isTokenPlan(getKey()) ? null : STANDARD_BASE;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } }
  >;
}

export interface ChatOpts {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface ChatResult {
  content: string;
  reasoning?: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export async function chatComplete(messages: ChatMessage[], opts: ChatOpts = {}): Promise<ChatResult> {
  const key = getKey();
  const url = `${chatBase()}/chat/completions`;
  const body: Record<string, unknown> = {
    model: opts.model ?? "mimo-v2.5-pro",
    messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 2200,
  };
  if (opts.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await r.text();
  if (!r.ok) {
    throw new Error(`MiMo chat ${r.status}: ${text.slice(0, 400)}`);
  }
  const json = JSON.parse(text);
  const choice = json.choices?.[0]?.message ?? {};
  return {
    content: typeof choice.content === "string" ? choice.content : "",
    reasoning: typeof choice.reasoning_content === "string" ? choice.reasoning_content : undefined,
    usage: json.usage,
  };
}

/**
 * Vision call — uses mimo-v2.5 (Pro does not accept multimodal).
 * Image MUST be a data URL (base64). External https URLs are rejected by MiMo.
 */
export async function visionAnalyze(prompt: string, imageDataUrls: string[], opts: ChatOpts = {}): Promise<ChatResult> {
  const content: ChatMessage["content"] = [
    { type: "text", text: prompt },
    ...imageDataUrls.map((url) => ({
      type: "image_url" as const,
      image_url: { url, detail: "high" as const },
    })),
  ];
  return chatComplete(
    [{ role: "user", content }],
    { ...opts, model: opts.model ?? "mimo-v2.5", maxTokens: opts.maxTokens ?? 1500 }
  );
}

/**
 * Speech-to-text — Standard tier only.
 * Returns null when current key is Token Plan (`tp-`) so UI can degrade.
 */
export async function transcribe(audioBytes: ArrayBuffer, mimeType: string): Promise<{ text: string; language?: string } | null> {
  const base = audioBase();
  if (!base) return null;

  const key = getKey();
  const ext = mimeToExt(mimeType);
  const blob = new Blob([audioBytes], { type: mimeType });
  const fd = new FormData();
  fd.append("file", blob, `recording.${ext}`);
  fd.append("model", "mimo-v2.5-asr");
  fd.append("response_format", "verbose_json");
  fd.append("language", "auto"); // ID + Javanese + Sundanese code-switch

  const r = await fetch(`${base}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: fd,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`MiMo ASR ${r.status}: ${text.slice(0, 300)}`);
  const json = JSON.parse(text);
  return { text: json.text ?? "", language: json.language };
}

/**
 * Text-to-speech — Standard tier only.
 * Returns null when on Token Plan.
 */
export async function speak(text: string, voice = "mimo:tts:id-female-calm", format: "mp3" | "wav" = "mp3"): Promise<Uint8Array | null> {
  const base = audioBase();
  if (!base) return null;
  const key = getKey();
  const r = await fetch(`${base}/audio/speech`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "mimo-v2.5-tts", input: text, voice, response_format: format }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`MiMo TTS ${r.status}: ${t.slice(0, 300)}`);
  }
  const arr = await r.arrayBuffer();
  return new Uint8Array(arr);
}

function mimeToExt(m: string): string {
  if (m.includes("wav")) return "wav";
  if (m.includes("webm")) return "webm";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("m4a") || m.includes("mp4")) return "m4a";
  return "mp3";
}

export function tierBanner(): string {
  return isTokenPlan(getKey())
    ? "Running on MiMo Token Plan — chat + vision live, audio routes degrade gracefully."
    : "Running on MiMo Standard — full multi-model stack.";
}
