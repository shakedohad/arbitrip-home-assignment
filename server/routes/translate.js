const express = require("express");

const { translateBatch } = require("../services/translationService");
const { normalizeText } = require("../utils/text");

const router = express.Router();

const allowedTypes = new Set(["content", "amenity", "policy"]);
const allowedLanguages = new Set(["en", "es", "he"]);
const MAX_ITEMS = 200;
const MAX_TEXT_LEN = 5000;

router.post("/", async (req, res) => {
  try {
    const {
      items,
      targetLanguage,
      sourceLocale = "en",
      context,
    } = req.body || {};

    if (!targetLanguage || typeof targetLanguage !== "string") {
      return res.status(400).json({ error: "Missing/invalid targetLanguage" });
    }

    if (!allowedLanguages.has(targetLanguage)) {
      return res.status(400).json({ error: "Unsupported targetLanguage" });
    }
    if (typeof sourceLocale !== "string" || sourceLocale.length !== 2) {
      return res.status(400).json({ error: "Missing/invalid sourceLocale" });
    }

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Expected body.items to be an array" });
    }

    if (items.length > MAX_ITEMS) {
      return res.status(400).json({ error: "Too many items for translation batch" });
    }

    const seen = new Set();
    const fields = [];

    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const { type, text } = item;
      if (!allowedTypes.has(type)) continue;
      const clean = normalizeText(text);
      if (!clean) continue;
      if (clean.length > MAX_TEXT_LEN) continue;

      const dedupeKey = `${type}:${clean}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      fields.push({ type, text: clean });
    }

    if (fields.length === 0) return res.json({ translations: [] });

    const translationsByKey = await translateBatch(fields, targetLanguage, sourceLocale);

    const translations = fields.map(({ type, text }) => {
      const key = `${type}:${text}:${targetLanguage}`;
      return {
        type,
        text,
        translatedText: translationsByKey[key] || text,
      };
    });

    return res.json({ translations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Translation failed" });
  }
});

module.exports = router;
