const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "hotels.jsonl");

let cache = null;

function loadHotels() {
  if (cache) return cache;
  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  cache = lines.map((line) => JSON.parse(line));
  return cache;
}

function getAllHotelsRaw() {
  return loadHotels();
}

function getHotelRawById(id) {
  const hotels = loadHotels();
  return hotels.find((h) => h.property_id === id) || null;
}

module.exports = { getAllHotelsRaw, getHotelRawById };

