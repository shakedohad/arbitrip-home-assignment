const { normalizeText } = require("./text");

/**
 * Build a single plain-text description from property copy + phone (no headline).
 */
function buildDescription(raw) {
  const d = raw.descriptions || {};
  const sections = [
    normalizeText(d.location || ""),
    normalizeText(d.rooms || ""),
    normalizeText(d.dining || ""),
  ].filter(Boolean);
  const phone =
    typeof raw.phone === "string" && raw.phone.trim() ? raw.phone.trim() : "";
  if (phone) sections.push(`Phone: ${phone}`);
  return sections.join("\n\n");
}

/** Property + room gallery URLs with hero image first (1000px). */
function heroFirstImageUrls(images) {
  if (!Array.isArray(images) || images.length === 0) return [];
  const heroIndex = images.findIndex((img) => img.hero_image);
  const ordered =
    heroIndex >= 0
      ? [images[heroIndex], ...images.filter((_, i) => i !== heroIndex)]
      : [...images];
  return ordered
    .map((img) => img.links?.["1000px"]?.href)
    .filter(Boolean);
}

function adaptHotel(raw) {
  const imageUrls = heroFirstImageUrls(raw.images);

  return {
    id: raw.property_id,
    name: raw.name,
    description: buildDescription(raw),
    amenities: Object.values(raw.amenities || {}).map((a) => a.name),
    policies: [
      normalizeText(raw.checkin?.instructions || ""),
      normalizeText(raw.policies?.know_before_you_go || ""),
    ].filter(Boolean),
    image: imageUrls[0] || "",
    images: imageUrls,
    rating: parseFloat(raw.ratings?.property?.rating) || 0,
    address: raw.address
      ? `${raw.address.line_1 || ""}, ${raw.address.city || ""}, ${
          raw.address.state_province_name || ""
        }`.replace(/^, |, $/, "")
      : "",
    lat: raw.location?.coordinates?.latitude,
    lng: raw.location?.coordinates?.longitude,
  };
}

module.exports = { adaptHotel };
