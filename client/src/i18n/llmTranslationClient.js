import { API_BASE_URL } from "../api/config";

const memoryCache = new Map();

function cacheKey({ text, targetLocale, type }) {
  return `i18n:llm:${type}:${targetLocale}:${text}`;
}

function stripDebugPrefix(translatedText, targetLocale) {
  if (typeof translatedText !== "string") return translatedText;
  // Previous stub added: `[${targetLanguage}] ${text}`
  const re = new RegExp(`^\\[${targetLocale}\\]\\s*`);
  return translatedText.replace(re, "").trimStart();
}

export function getCachedTranslation({ text, targetLocale, type }) {
  const key = cacheKey({ text, targetLocale, type });
  if (memoryCache.has(key)) {
    const stored = stripDebugPrefix(memoryCache.get(key), targetLocale);
    // Avoid treating "untranslated" values as valid cache hits.
    if (stored === text) return null;
    return stored;
  }
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const sanitized = stripDebugPrefix(stored, targetLocale);
      if (sanitized === text) return null;
      memoryCache.set(key, sanitized);
      return sanitized;
    }
  } catch {
    // ignore localStorage failures
  }
  return null;
}

export function setCachedTranslation({ text, targetLocale, type, translatedText }) {
  const key = cacheKey({ text, targetLocale, type });
  memoryCache.set(key, translatedText);
  try {
    localStorage.setItem(key, translatedText);
  } catch {
    // ignore localStorage failures
  }
}

export async function requestLLMBatchTranslation({
  items,
  sourceLocale = "en",
  targetLocale,
  context,
  signal,
}) {
  if (!targetLocale) throw new Error("Missing required field: targetLocale.");
  if (!Array.isArray(items)) throw new Error("Missing required field: items.");

  const res = await fetch(`${API_BASE_URL}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items,
      targetLanguage: targetLocale,
      sourceLocale,
      context,
    }),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Batch translation request failed: ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data?.translations)) {
    throw new Error("Batch translation response missing translations[].");
  }

  return data.translations;
}

export async function ensureLLMBatchTranslation({
  items,
  sourceLocale = "en",
  targetLocale,
  context,
  signal,
}) {
  if (!Array.isArray(items)) throw new Error("Missing required field: items.");
  if (!targetLocale) throw new Error("Missing required field: targetLocale.");

  // Keep order aligned with input items.
  const translationsByTypeText = new Map();
  const missing = [];

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const { type = "content", text } = item;
    if (typeof text !== "string" || !text) continue;

    const cached = getCachedTranslation({ text, targetLocale, type });
    if (cached) {
      translationsByTypeText.set(`${type}:${text}`, cached);
      continue;
    }

    missing.push({ type, text });
  }

  if (missing.length > 0) {
    const translatedItems = await requestLLMBatchTranslation({
      items: missing,
      sourceLocale,
      targetLocale,
      context,
      signal,
    });

    for (const translated of translatedItems) {
      if (!translated || typeof translated !== "object") continue;
      const { type, text, translatedText } = translated;
      if (typeof type !== "string" || typeof text !== "string") continue;
      if (typeof translatedText !== "string") continue;

      // Cost-safe correctness: if translation didn't change the text, don't cache it.
      if (translatedText !== text) {
        setCachedTranslation({ text, targetLocale, type, translatedText });
      }
      translationsByTypeText.set(`${type}:${text}`, translatedText);
    }
  }

  // Return translations aligned to the input items.
  return items.map((item) => {
    const type = item?.type ?? "content";
    const text = item?.text;
    if (typeof text !== "string" || !text) {
      return { type, text: "", translatedText: "" };
    }
    const translatedText = translationsByTypeText.get(`${type}:${text}`) || text;
    return { type, text, translatedText };
  });
}

