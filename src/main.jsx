import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../public/reset.css";
import "../public/style.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
