import { translations, DEFAULT_LOCALE } from "./translations";

function formatParams(text, params) {
  if (!params) return text;
  return Object.keys(params).reduce(
    (acc, key) => acc.replace(new RegExp(`{${key}}`, "g"), params[key]),
    text
  );
}

/**
 * Core translation helper.
 *
 * Usage:
 *   t("content")
 *   t("greeting", { name: "John" })
 *   t("content", undefined, "es")
 *
 * For hotel-provided fields (dynamic text) you can also call:
 *   t(hotel.name)
 *   t(hotel.description)
 */
export function t(key, params, locale = DEFAULT_LOCALE) {
  const dict = translations[locale] || {};
  const raw = dict[key] ?? key;
  return formatParams(raw, params);
}

