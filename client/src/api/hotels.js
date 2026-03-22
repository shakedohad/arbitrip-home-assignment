import { API_BASE_URL } from "./config";

export async function fetchHotels() {
  const res = await fetch(`${API_BASE_URL}/api/hotels`);
  if (!res.ok) throw new Error(`Failed to fetch hotels: ${res.status}`);
  const data = await res.json();
  return data.hotels || [];
}

export async function fetchHotelById(id) {
  const res = await fetch(`${API_BASE_URL}/api/hotels/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch hotel: ${res.status}`);
  const data = await res.json();
  return data.hotel || null;
}

