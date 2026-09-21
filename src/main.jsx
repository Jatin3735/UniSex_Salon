import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { purgeLegacyKeys } from "./lib/safeStorage.js";

// Drop keys written by the pre-rewrite build (an unvalidated `user`, bookings
// in the old shape) so a browser that ran the old code starts clean.
purgeLegacyKeys();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
