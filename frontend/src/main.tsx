import React from "react";
import ReactDOM from "react-dom/client";
import App from "./pages/HomePage";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/redesign.css";
import "./styles/dashboard.css";
import "./styles/controls.css";
import "./styles/carousel.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
