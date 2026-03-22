import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../i18n/translations";
import { fetchHotelById } from "../api/hotels";
import Tabs from "../components/Tabs";
import ContentTab from "../components/Hotel/ContentTab";
import AmenitiesTab from "../components/Hotel/AmenitiesTab";
import PoliciesTab from "../components/Hotel/PoliciesTab";
import ImageCarousel from "../components/hotel-widgets/ImageCarousel";
import StarRating from "../components/hotel-widgets/StarRating";
import "./HotelPage.css";

function tabToDynamicType(tabId) {
  if (tabId === "content") return "content";
  if (tabId === "amenities") return "amenity";
  if (tabId === "policies") return "policy";
  return null;
}

export default function HotelPage() {
  const { id, locale: routeLocale } = useParams();
  const { t, locale, loadHotelTypeTranslations } = useTranslation();
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabTranslating, setTabTranslating] = useState(false);
  const tabLoadGenRef = useRef(0);

  const normalizeTextForTranslation = useCallback((text) => {
    if (typeof text !== "string") return "";
    return text.replace(/<[^>]+>/g, "").trim();
  }, []);

  const isRtl = locale === "he";
  const localePrefix =
    routeLocale && routeLocale !== DEFAULT_LOCALE && SUPPORTED_LOCALES.includes(routeLocale)
      ? `/${routeLocale}`
      : "";

  const [tab, setTab] = useState("content");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchHotelById(id)
      .then((data) => {
        if (!alive) return;
        setHotel(data);
      })
      .catch(() => {
        if (!alive) return;
        setHotel(null);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!hotel) return;

    if (!locale || locale === DEFAULT_LOCALE) {
      setTabTranslating(false);
      return;
    }

    const dynamicType = tabToDynamicType(tab);
    if (!dynamicType) {
      setTabTranslating(false);
      return;
    }

    let items = [];
    if (dynamicType === "content") {
      const text = normalizeTextForTranslation(hotel.description);
      if (text) items.push({ type: "content", text });
    } else if (dynamicType === "amenity") {
      for (const amenity of hotel.amenities || []) {
        const clean = normalizeTextForTranslation(amenity);
        if (clean) items.push({ type: "amenity", text: clean });
      }
    } else if (dynamicType === "policy") {
      for (const policy of hotel.policies || []) {
        const clean = normalizeTextForTranslation(policy);
        if (clean) items.push({ type: "policy", text: clean });
      }
    }

    if (items.length === 0) {
      setTabTranslating(false);
      return;
    }

    const gen = ++tabLoadGenRef.current;
    setTabTranslating(true);

    loadHotelTypeTranslations({
      hotelId: hotel.id,
      type: dynamicType,
      items,
      targetLocale: locale,
    }).finally(() => {
      if (tabLoadGenRef.current === gen) {
        setTabTranslating(false);
      }
    });
  }, [hotel, locale, tab, loadHotelTypeTranslations, normalizeTextForTranslation]);

  const translatedContent = useMemo(() => {
    if (!hotel || tab !== "content") return "";
    const text = normalizeTextForTranslation(hotel.description);
    if (!text) return "";
    return t({ text, type: "content" });
  }, [hotel, tab, t, normalizeTextForTranslation]);

  const translatedAmenities = useMemo(() => {
    if (!hotel?.amenities || tab !== "amenities") return [];
    return hotel.amenities
      .map((a) => normalizeTextForTranslation(a))
      .filter(Boolean)
      .map((clean) => t({ text: clean, type: "amenity" }));
  }, [hotel, tab, t, normalizeTextForTranslation]);

  const translatedPolicies = useMemo(() => {
    if (!hotel?.policies || tab !== "policies") return [];
    return hotel.policies
      .map((p) => normalizeTextForTranslation(p))
      .filter(Boolean)
      .map((clean) => t({ text: clean, type: "policy" }));
  }, [hotel, tab, t, normalizeTextForTranslation]);

  const tabs = useMemo(
    () => [
      { id: "content", label: t("content") },
      { id: "amenities", label: t("amenities") },
      { id: "policies", label: t("policies") },
    ],
    [t]
  );

  if (loading) return <div className="hotel-page__loading">Loading...</div>;
  if (!hotel) return <div>{t("hotel_not_found")}</div>;

  return (
    <div className="hotel-page">
      <Link to={`${localePrefix}/`} className="hotel-page__back-link">
        <span className={`hotel-page__back-arrow ${isRtl ? "hotel-page__back-arrow--rtl" : ""}`}>
          ←
        </span>{" "}
        Back to Hotels
      </Link>

      <h1>{hotel.name}</h1>

      {hotel.images.length > 0 ? (
        <ImageCarousel images={hotel.images} alt={hotel.name} />
      ) : (
        <div className="hotel-page__no-image">
          {t("no_images")}
        </div>
      )}

      {hotel.rating > 0 && (
        <div className="hotel-page__rating">
          <StarRating rating={hotel.rating} showValue />
        </div>
      )}

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      <div className="hotel-page__tab-panel">
        {locale !== DEFAULT_LOCALE && tabTranslating ? (
          <div className="hotel-page__translations-loading" aria-live="polite">
            {t("translating")}
          </div>
        ) : (
          <>
            {tab === "content" && <ContentTab text={translatedContent} />}
            {tab === "amenities" && <AmenitiesTab items={translatedAmenities} />}
            {tab === "policies" && <PoliciesTab items={translatedPolicies} />}
          </>
        )}
      </div>
    </div>
  );
}
