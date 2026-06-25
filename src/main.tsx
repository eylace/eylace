import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { initWebVitals } from "./lib/webVitals";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

// Kick off Core Web Vitals reporting (FCP/LCP/CLS/INP/TTFB).
initWebVitals();

