import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { t as coreTranslate } from "./translate";
import { DEFAULT_LOCALE } from "./translations";
import { ensureLLMBatchTranslation } from "./llmTranslationClient";

const I18nContext = createContext();

export function I18nProvider({ children, initialLocale }) {
  const [locale, setLocale] = useState(initialLocale || DEFAULT_LOCALE);
  const [dynamicTranslations, setDynamicTranslations] = useState({});
  const batchInFlightRef = useRef(new Map()); // key -> Promise
  const allowedDynamicTypes = useRef(new Set(["content", "amenity", "policy"])).current;
  const localeRef = useRef(locale);
  const activeTranslationControllersRef = useRef(new Set());

  localeRef.current = locale;

  // Single source of truth: URL → locale. Abort in-flight LLM calls when the route language changes.
  useEffect(() => {
    const next = initialLocale || DEFAULT_LOCALE;
    for (const c of activeTranslationControllersRef.current) {
      c.abort();
    }
    activeTranslationControllersRef.current.clear();
    setLocale(next);
  }, [initialLocale]);

  const makeDynamicKey = useCallback(
    (type, text, targetLocale) => `dyn:${type}:${targetLocale}:${text}`,
    []
  );

  const normalizeText = useCallback((text) => {
    if (typeof text !== "string") return "";
    return text.replace(/<[^>]+>/g, "").trim();
  }, []);

  /**
   * One batched API call for a single dynamic type (content | amenity | policy).
   * Caller should invoke when the user views that slice of data (e.g. active tab).
   */
  const loadHotelTypeTranslations = useCallback(
    async ({ hotelId, type, items, targetLocale }) => {
      // Caller must pass the active UI language so we never use a stale closure locale.
      const effectiveTargetLocale = targetLocale ?? localeRef.current;

      if (!effectiveTargetLocale || effectiveTargetLocale === DEFAULT_LOCALE) {
        return Promise.resolve();
      }

      if (effectiveTargetLocale !== localeRef.current) {
        return Promise.resolve();
      }

      if (!allowedDynamicTypes.has(type)) {
        return Promise.resolve();
      }

      const normalizedItems = [];
      const seen = new Set();

      for (const item of items || []) {
        if (!item || typeof item !== "object") continue;
        const itemType = item.type;
        if (itemType !== type) continue;

        const text = normalizeText(item.text);
        if (!text) continue;

        const dedupeKey = `${itemType}:${text}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        normalizedItems.push({ type: itemType, text });
      }

      if (normalizedItems.length === 0) {
        return Promise.resolve();
      }

      const batchKey = `hotel:${hotelId || "unknown"}:${effectiveTargetLocale}:${type}`;
      if (batchInFlightRef.current.has(batchKey)) {
        return batchInFlightRef.current.get(batchKey);
      }

      const p = (async () => {
        const abortController = new AbortController();
        activeTranslationControllersRef.current.add(abortController);

        try {
          const translated = await ensureLLMBatchTranslation({
            items: normalizedItems,
            sourceLocale: DEFAULT_LOCALE,
            targetLocale: effectiveTargetLocale,
            signal: abortController.signal,
          });

          if (localeRef.current !== effectiveTargetLocale) {
            return;
          }

          setDynamicTranslations((prev) => {
            const next = { ...prev };
            for (const tItem of translated || []) {
              const { type: tType, text, translatedText } = tItem || {};
              if (!tType || typeof text !== "string") continue;
              const dynKey = makeDynamicKey(tType, text, effectiveTargetLocale);
              next[dynKey] = typeof translatedText === "string" ? translatedText : text;
            }
            return next;
          });
        } catch (err) {
          if (err?.name === "AbortError") {
            return;
          }
          if (localeRef.current !== effectiveTargetLocale) {
            return;
          }
          setDynamicTranslations((prev) => {
            const next = { ...prev };
            for (const { type: tType, text } of normalizedItems) {
              const dynKey = makeDynamicKey(tType, text, effectiveTargetLocale);
              next[dynKey] = text;
            }
            return next;
          });
        } finally {
          activeTranslationControllersRef.current.delete(abortController);
          batchInFlightRef.current.delete(batchKey);
        }
      })();

      batchInFlightRef.current.set(batchKey, p);
      return p;
    },
    [normalizeText, makeDynamicKey]
  );

  // Bound helper that still allows overriding the locale per call:
  // t(key, params?, localeOverride?)
  const t = (key, params, localeOverride) => {
    const targetLocale = localeOverride || locale;

    // Hotel-provided dynamic fields:
    //   t({ text: "Free WiFi", type: "amenity" }, params?, locale?)
    if (
      key &&
      typeof key === "object" &&
      "text" in key &&
      "type" in key
    ) {
      const { text, type } = key || {};
      if (typeof text !== "string" || !text) return text || "";
      if (!type) return text;

      // Security/correctness: only translate the hotel categories we support.
      if (!allowedDynamicTypes.has(type)) return text;

      // No need to translate default locale.
      if (targetLocale === DEFAULT_LOCALE) return text;

      const dynKey = makeDynamicKey(type, text, targetLocale);
      if (Object.prototype.hasOwnProperty.call(dynamicTranslations, dynKey)) {
        return dynamicTranslations[dynKey];
      }

      // Translations are loaded in batch per type via loadHotelTypeTranslations (e.g. on tab view).
      return text;
    }

    return coreTranslate(key, params, targetLocale);
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, loadHotelTypeTranslations }}>
      <div dir={locale === "he" ? "rtl" : "ltr"}>
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
