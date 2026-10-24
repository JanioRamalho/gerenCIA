import ExperiencePage from "./pages/ExperiencePage";
import LoginPage from "./pages/LoginPage";
import PanelPage from "./pages/PanelPage";
import RegistrationPage from "./pages/RegistrationPage";

/**
 * Escolhe a página pelo endereço do navegador.
 *
 * O projeto não usa biblioteca de rotas: são poucas páginas, e cada link
 * recarrega a página inteira, então basta ler o endereço uma vez.
 */
export default function App() {
  // Tira a barra do final, para "/app/" e "/app" abrirem a mesma página.
  const path = window.location.pathname.replace(/\/$/, "");

  if (path === "/login") {
    return <LoginPage />;
  }
  if (path === "/register") {
    return <RegistrationPage />;
  }
  if (path === "/app" || path.startsWith("/app/")) {
    return <PanelPage path={path} />;
  }
  return <ExperiencePage />;
}
