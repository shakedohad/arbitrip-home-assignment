/**
 * Shared text cleanup for translation pipelines: strip HTML tags and trim.
 */
function normalizeText(text) {
  if (typeof text !== "string") return "";
  return text.replace(/<[^>]+>/g, "").trim();
}

module.exports = { normalizeText };
