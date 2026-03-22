function stripHtml(html) {
  return html?.replace(/<[^>]+>/g, "") || "";
}

export function adaptHotel(raw) {
  return {
    id: raw.property_id,

    name: raw.name,

    description: raw.descriptions?.headline ||
  raw.descriptions?.location ||
  raw.descriptions?.rooms ||
  "",

    amenities: Object.values(raw.amenities || {}).map((a) => a.name),

    policies: [
  stripHtml(raw.checkin?.instructions),
  stripHtml(raw.policies?.know_before_you_go),
].filter(Boolean),

    image:
      raw.images?.find((img) => img.hero_image)?.links?.["1000px"]?.href ||
      raw.images?.[0]?.links?.["1000px"]?.href,

    images: raw.images?.map((img) => img.links?.["1000px"]?.href).filter(Boolean) || [],

    rating: parseFloat(raw.ratings?.property?.rating) || 0,

    address: raw.address ? `${raw.address.line_1 || ''}, ${raw.address.city || ''}, ${raw.address.state_province_name || ''}`.replace(/^, |, $/, '') : '',

    lat: raw.location?.coordinates?.latitude,
    lng: raw.location?.coordinates?.longitude,
  };
}
