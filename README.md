# Arbitrip home assignment

## LLM translation (Gemini)

For hotel text to be translated via the Google Gemini API:

1. Create a file named `.env` inside the **`server/`** folder.
2. Add a line: `GEMINI_API_KEY=XXXXX` (no quotes unless your key contains spaces).
3. Open [Google AI Studio API keys](https://aistudio.google.com/app/u/0/api-keys), sign in, create an API key, and replace `XXXXX` with that key.
4. Restart the server so it reloads `server/.env`.

If the key is missing or invalid, the server still runs but returns **identity** translations (original English text) for dynamic fields.

Optional: set `GEMINI_MODEL` in the same `.env` file to force a specific model name (see `server/services/translationService.js` for fallbacks).

Remarks:
1. The data loaded from the server is through a `.jsonl` file. Modifying its data will require a server restart.