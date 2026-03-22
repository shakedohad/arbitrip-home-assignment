import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchHotels } from "../api/hotels";
import { MdWifi, MdLocalParking, MdOutlineDesk, MdFreeBreakfast, MdAccessibility, MdSmokeFree } from "react-icons/md";
import { FaCar } from "react-icons/fa";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../i18n/translations";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const amenityIcons = {
  "Free WiFi": MdWifi,
  "Free self parking": FaCar,
  "24-hour front desk": MdOutlineDesk,
  "Breakfast available (surcharge)": MdFreeBreakfast,
  "Wheelchair accessible – no": MdAccessibility,
  "Smoke-free property": MdSmokeFree,
};

export default function HotelsListPage() {
  const [hotels, setHotels] = useState([]);
  const [hoveredHotelId, setHoveredHotelId] = useState(null);
  const [cardHoveredHotelId, setCardHoveredHotelId] = useState(null);
  const hoveredHotelIdRef = useRef(null);
  const cardHoveredHotelIdRef = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const { locale: routeLocale } = useParams();

  const localePrefix =
    routeLocale && routeLocale !== DEFAULT_LOCALE && SUPPORTED_LOCALES.includes(routeLocale)
      ? `/${routeLocale}`
      : "";

  useEffect(() => {
    hoveredHotelIdRef.current = hoveredHotelId;
  }, [hoveredHotelId]);

  useEffect(() => {
    cardHoveredHotelIdRef.current = cardHoveredHotelId;
  }, [cardHoveredHotelId]);

  useEffect(() => {
    let alive = true;
    fetchHotels()
      .then((data) => {
        if (alive) setHotels(data);
      })
      .catch(() => {
        if (alive) setHotels([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    const validHotels = hotels.filter((h) => h.lat && h.lng);
    if (validHotels.length === 0) return;

    const center = [validHotels[0].lat, validHotels[0].lng];
    const map = L.map(mapRef.current).setView(center, 10);

    const bounds = L.latLngBounds(validHotels.map((h) => [h.lat, h.lng]));
    map.fitBounds(bounds);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markersRef.current = validHotels.map((hotel) => {
      const addressPart = hotel.address ? `<br />${escapeHtml(hotel.address)}` : "";
      const tooltipHtml = `<strong>${escapeHtml(hotel.name)}</strong>${addressPart}`;

      const marker = L.marker([hotel.lat, hotel.lng]).addTo(map);

      const updateMarker = () => {
        const isHovered = hoveredHotelIdRef.current === hotel.id;
        const isCardHover = cardHoveredHotelIdRef.current === hotel.id;
        const offset = isCardHover ? [0, -44] : [0, -14];

        marker.unbindTooltip();
        marker.bindTooltip(tooltipHtml, {
          direction: "top",
          offset,
          opacity: 1,
          sticky: true,
        });

        const icon = isHovered
          ? L.icon({
              iconUrl:
                "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              shadowSize: [41, 41],
            })
          : L.icon({
              iconUrl:
                "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              shadowSize: [41, 41],
            });
        marker.setIcon(icon);

        if (isHovered) marker.openTooltip();
        else marker.closeTooltip();
      };

      marker.on("mouseover", () => {
        setHoveredHotelId(hotel.id);
      });
      marker.on("mouseout", () => {
        setHoveredHotelId((id) => (id === hotel.id ? null : id));
      });

      updateMarker();
      return { marker, updateMarker };
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [hotels]);

  useEffect(() => {
    markersRef.current.forEach(({ updateMarker }) => updateMarker());
  }, [hoveredHotelId, cardHoveredHotelId]);

  useEffect(() => {
    if (!mapInstanceRef.current || !hoveredHotelId) return;
    const hotel = hotels.find((h) => h.id === hoveredHotelId);
    if (hotel && hotel.lat && hotel.lng) {
      mapInstanceRef.current.panTo([hotel.lat, hotel.lng]);
    }
  }, [hoveredHotelId, hotels]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex" }}>
        <div style={{ flex: "none", width: "45%", padding: 20 }}>
          {hotels.map((hotel) => (
            <Link
              key={hotel.id}
              to={`${localePrefix}/hotel/${hotel.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  border:
                    hoveredHotelId === hotel.id ? "1px solid #007bff" : "1px solid #ddd",
                  borderRadius: 8,
                  marginBottom: 16,
                  padding: 16,
                  cursor: "pointer",
                  background: "#fff",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                }}
                onMouseEnter={() => {
                  setHoveredHotelId(hotel.id);
                  setCardHoveredHotelId(hotel.id);
                }}
                onMouseLeave={() => {
                  setCardHoveredHotelId(null);
                  setHoveredHotelId(null);
                }}
              >
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 4 }}
                />
                <div style={{ display: "flex", alignItems: "center", margin: "8px 0" }}>
                  <h3 style={{ margin: 0, color: "black" }}>{hotel.name}</h3>
                  {hotel.rating > 0 && (
                    <span style={{ marginLeft: 8, fontSize: "14px", color: "#ffd700" }}>
                      {"★".repeat(Math.round(hotel.rating))}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    color: "#666",
                  }}
                >
                  {hotel.address && <span>{hotel.address}</span>}
                </div>
                <div style={{ marginTop: 8 }}>
                  {hotel.amenities &&
                    hotel.amenities.slice(0, 4).map((amenity) => {
                      const Icon = amenityIcons[amenity];
                      return Icon ? (
                        <Icon
                          key={amenity}
                          style={{ fontSize: 16, marginRight: 8, color: "#666" }}
                          title={amenity}
                          aria-label={amenity}
                        />
                      ) : null;
                    })}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            position: "sticky",
            top: 0,
            height: "100vh",
            padding: "20px 20px 20px 0",
          }}
        >
          <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
        </div>
      </div>
    </div>
  );
}
