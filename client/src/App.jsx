import { BrowserRouter as Router, Routes, Route, Outlet, useParams } from "react-router-dom";
import { I18nProvider } from "./i18n/i18nProvider";
import { useTranslation } from "./i18n/useTranslation";
import { DEFAULT_LOCALE } from "./i18n/translations";
import HotelsListPage from "./pages/HotelsListPage";
import HotelPage from "./pages/HotelPage";
import MapPage from "./pages/MapPage";
import LanguageSelector from "./components/LanguageSelector";

function AppHeader() {
  const { t } = useTranslation();

  return (
    <header
      // Keep the header layout LTR even when the page uses RTL.
      dir="ltr"
      style={{
        direction: "ltr",
        background: "#f8f9fa",
        padding: "10px 20px",
        borderBottom: "1px solid #ddd",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h2 style={{ margin: 0, color: "#333" }}>{t("app_title")}</h2>
      <LanguageSelector />
    </header>
  );
}
function AppLayout() {
  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  );
}

function RoutedApp() {
  const params = useParams();
  const routeLocale = params.locale;
  const effectiveLocale =
    routeLocale && routeLocale !== DEFAULT_LOCALE ? routeLocale : DEFAULT_LOCALE;

  return (
    <I18nProvider initialLocale={effectiveLocale}>
      <AppLayout />
    </I18nProvider>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Default locale with clean URLs */}
        <Route element={<RoutedApp />}>
          <Route path="/" element={<HotelsListPage />} />
          <Route path="/hotel/:id" element={<HotelPage />} />
          <Route path="/map" element={<MapPage />} />
        </Route>

        {/* Non-default locales, e.g. /es, /he */}
        <Route path="/:locale" element={<RoutedApp />}>
          <Route index element={<HotelsListPage />} />
          <Route path="hotel/:id" element={<HotelPage />} />
          <Route path="map" element={<MapPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
