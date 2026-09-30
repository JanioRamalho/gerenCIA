import React from "react";
import ReactDOM from "react-dom/client";
import App from "./pages/ExperiencePage";
import "./styles/tokens.css";
import "./styles/experience.css";
import "./styles/experience-responsive.css";
import "./styles/premium.css";
import "./styles/data-visuals.css";
import "./styles/hero-mascot.css";
import "./styles/identity.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
