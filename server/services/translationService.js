/**
 * Translation service:
 * - cache uses a single flat key: `${type}:${text}:${language}`
 *   (this avoids collisions where the same string appears in different fields)
 * - callers pass an array of { text, type }
 *
 * Gemini: set GEMINI_API_KEY in server/.env (loaded via dotenv in ../index.js).
 * Optional: GEMINI_MODEL to force a specific model name.
 */
let GoogleGenerativeAI = null;
try {
  // Optional dependency; we only need it when we actually call Gemini.
  ({ GoogleGenerativeAI } = require("@google/generative-ai"));
} catch (_e) {
  // Dependency not installed; we'll fall back to a stub translation.
}

const cache = {}; // cache[flatKey] = translatedText

function cacheKey(type, text, language) {
  return `${type}:${text}:${language}`;
}

function parseJsonSafely(textResponse) {
  try {
    return JSON.parse(textResponse);
  } catch (_e) {
    // Try to extract the first JSON object from the response.
    const match = textResponse.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Invalid JSON from LLM");
  }
}

async function translateBatch(fields, targetLanguage, sourceLanguage = "en") {
  const result = {}; // cacheKey -> translatedText

  const missingKeys = []; // each entry corresponds to one unique (type + text)
  const missingTextSet = new Set(); // raw unique texts for the LLM prompt

  const maxLogLen = 2000;
  const truncateForLog = (v) => {
    try {
      const s = typeof v === "string" ? v : JSON.stringify(v);
      if (!s) return s;
      return s.length > maxLogLen ? `${s.slice(0, maxLogLen)}...` : s;
    } catch {
      return "[unloggable]";
    }
  };

  const callGemini = async (missingTexts) => {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const shouldUseGemini = GoogleGenerativeAI && apiKey.length > 0;

    if (!shouldUseGemini) {
      console.warn(
        "Gemini disabled (missing dependency or GEMINI_API_KEY). Returning identity translations."
      );
      return Object.fromEntries(missingTexts.map((t) => [t, t]));
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Model names can be deprecated/renamed; try multiple candidates.
    // Optional override: set GEMINI_MODEL to force the first choice.
    const preferredModel = process.env.GEMINI_MODEL;
    const candidateModels = [
      preferredModel,
      "gemini-flash-latest",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-pro-latest",
      "gemini-1.5-flash-002",
      "gemini-1.5-flash",
    ].filter(Boolean);

    const prompt = `
You are a translation engine.
Translate the following phrases from ${sourceLanguage} to ${targetLanguage}.
Return ONLY valid JSON mapping original text to translated text (no markdown, no extra keys).

Input:
${JSON.stringify(missingTexts)}
`;

    console.log(
      `LLM PROMPT (target=${targetLanguage}, source=${sourceLanguage}, missingCount=${missingTexts.length}):`,
      truncateForLog(prompt)
    );

    let lastErr = null;
    for (const modelName of candidateModels) {
      try {
        console.log(`Trying Gemini model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const response = await model.generateContent(prompt);

        const textResponse = response.response.text();
        console.log("LLM RAW RESPONSE:", truncateForLog(textResponse));

        const parsed = parseJsonSafely(textResponse);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("LLM returned invalid translations JSON (expected an object map).");
        }

        const parsedKeys = Object.keys(parsed);
        console.log("LLM PARSED TRANSLATIONS (keysCount):", parsedKeys.length);

        const unmapped = missingTexts.filter((t) => !Object.prototype.hasOwnProperty.call(parsed, t));
        if (unmapped.length > 0) {
          console.warn(
            `LLM UNMAPPED INPUTS (count=${unmapped.length}):`,
            truncateForLog(unmapped)
          );
        }

        return parsed;
      } catch (err) {
        lastErr = err;
        console.error(`Gemini model failed (${modelName}):`, err);
      }
    }

    throw lastErr || new Error("Gemini translation failed for all candidate models.");
  };

  // 1. cache lookup with flat keys and logging
  for (const field of fields || []) {
    const type = field.type;
    const text = field.text;
    if (!type || typeof text !== "string") continue;

    const key = cacheKey(type, text, targetLanguage);
    if (Object.prototype.hasOwnProperty.call(cache, key)) {
      const cachedValue = cache[key];
      console.log(`CACHE HIT: ${key}`);

      // Cost-safe correctness: never treat "identity" cached translations as usable.
      if (cachedValue === text) {
        console.log(`CACHE HIT is identity; treating as miss: ${key}`);
        missingKeys.push({ key, type, text });
        missingTextSet.add(text);
      } else {
        result[key] = cachedValue;
        continue;
      }
    }

    console.log(`CACHE MISS: ${key}`);
    missingKeys.push({ key, type, text });
    missingTextSet.add(text);
  }

  // 2. call LLM only for missing text values
  // Note: we still deduplicate the LLM input by raw text (constraint: prompt uses raw text only).
  // After we receive translations, we write them back for *each* missing flat cache key.
  const missingTexts = Array.from(missingTextSet);
  if (missingTexts.length > 0) {
    let translatedByText = {};
    try {
      translatedByText = await callGemini(missingTexts);
    } catch (err) {
      console.error("LLM TRANSLATION ERROR:", err);
      // Important: do not cache anything on error.
      throw err;
    }

    // 3. update cache + result per missing key
    for (const { key, text } of missingKeys) {
      const candidate =
        Object.prototype.hasOwnProperty.call(translatedByText, text) ? translatedByText[text] : text;
      const translatedText = typeof candidate === "string" ? candidate : text;

      result[key] = translatedText;

      // Don't cache if the translation errored into identity.
      if (translatedText !== text) {
        cache[key] = translatedText;
      } else {
        console.log(`Not caching identity translation for ${key}`);
      }
    }
  }

  return result;
}

module.exports = { translateBatch };
