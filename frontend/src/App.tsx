import { lazy, Suspense } from "react";
import ExperiencePage from "./pages/ExperiencePage";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";

const PanelPage = lazy(() => import("./pages/PanelPage"));
const AnalysisTestPage = lazy(() => import("./pages/AnalysisTestPage"));

/**
 * Escolhe a página pelo endereço do navegador.
 *
 * O projeto não usa biblioteca de rotas: são poucas páginas, e cada link
 * recarrega a página inteira, então basta ler o endereço uma vez.
 */
export default function App() {
  // Tira a barra do final, para "/app/" e "/app" abrirem a mesma página.
  const path = window.location.pathname.replace(/\/$/, "");

  if (path === "/teste-analise") {
    return <Suspense fallback={<p role="status">Carregando a prévia…</p>}><AnalysisTestPage /></Suspense>;
  }
  if (path === "/login") {
    return <LoginPage />;
  }
  if (path === "/register") {
    return <RegistrationPage />;
  }
  if (path === "/app" || path.startsWith("/app/")) {
    return <Suspense fallback={<p role="status">Carregando o painel…</p>}><PanelPage path={path} /></Suspense>;
  }
  return <ExperiencePage />;
}
