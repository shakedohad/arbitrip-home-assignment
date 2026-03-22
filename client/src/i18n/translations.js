// Base translation dictionary.
// Keys should be stable identifiers used across the app.
export const translations = {
  en: {
    content: "Content",
    amenities: "Amenities",
    policies: "Policies",
    hotel_not_found: "Hotel not found",
    back_to_hotels: "← Back to Hotels",
    no_images: "No images available",
    app_title: "Arbitrip",
    translating: "Loading translations…",
  },
  es: {
    content: "Contenido",
    amenities: "Comodidades",
    policies: "Políticas",
    hotel_not_found: "Hotel no encontrado",
    back_to_hotels: "← Volver a Hoteles",
    no_images: "No hay imágenes disponibles",
    app_title: "Arbitrip",
    translating: "Cargando traducciones…",
  },
  he: {
    content: "תוכן",
    amenities: "מתקנים",
    policies: "מדיניות",
    hotel_not_found: "המלון לא נמצא",
    back_to_hotels: "← חזרה למלונות",
    no_images: "אין תמונות זמינות",
    app_title: "Arbitrip",
    translating: "טוען תרגומים…",
  },
};

export const DEFAULT_LOCALE = "en";
export const SUPPORTED_LOCALES = Object.keys(translations);

