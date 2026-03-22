import { useI18n } from "../../i18n/i18nProvider";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../../i18n/translations";
import { useLocation, useNavigate } from "react-router-dom";
import { LANGUAGE_OPTIONS } from "./languageOptions";
import "./LanguageSelector.css";

export default function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (nextLocale) => {
    setLocale(nextLocale);
    const segments = location.pathname.split("/").filter(Boolean);
    const currentFirst = segments[0];
    let basePath;

    if (SUPPORTED_LOCALES.includes(currentFirst)) {
      basePath = "/" + segments.slice(1).join("/");
    } else {
      basePath = location.pathname;
    }

    const targetPath =
      nextLocale === DEFAULT_LOCALE
        ? basePath
        : `/${nextLocale}${basePath === "/" ? "" : basePath}`;

    navigate(targetPath || "/");
  };

  return (
    <select
      className="language-selector"
      value={locale}
      onChange={(e) => handleChange(e.target.value)}
    >
      {LANGUAGE_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
