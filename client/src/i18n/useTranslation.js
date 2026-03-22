import { useI18n } from "./i18nProvider";

// Hook wrapper so components can access the single translation helper.
// Signature: t(key, params?, locale?)
export function useTranslation() {
  const { t, locale, setLocale, loadHotelTypeTranslations } = useI18n();
  return { t, locale, setLocale, loadHotelTypeTranslations };
}

