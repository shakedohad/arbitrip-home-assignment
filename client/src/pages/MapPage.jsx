import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchHotels } from "../api/hotels";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function plainDescription(html) {
  if (typeof html !== "string") return "";
  return html.replace(/<[^>]+>/g, "").trim();
}

export default function MapPage() {
  const mapRef = useRef(null);
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    let alive = true;
    fetchHotels()
      .then((data) => {
        if (alive) setHotels(data.filter((h) => h.lat && h.lng));
      })
      .catch(() => {
        if (alive) setHotels([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || hotels.length === 0) return;

    const center = [hotels[0].lat, hotels[0].lng];
    const map = L.map(mapRef.current).setView(center, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    hotels.forEach((hotel) => {
      const desc = escapeHtml(plainDescription(hotel.description));
      L.marker([hotel.lat, hotel.lng])
        .addTo(map)
        .bindPopup(`<strong>${escapeHtml(hotel.name)}</strong><br />${desc}`);
    });

    return () => {
      map.remove();
    };
  }, [hotels]);

  return (
    <div style={{ height: "500px", width: "100%" }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
}
