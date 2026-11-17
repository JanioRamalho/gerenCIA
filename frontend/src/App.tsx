import { lazy, Suspense, useEffect } from "react";
import ExperiencePage from "./pages/ExperiencePage";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";

const PanelPage = lazy(() => import("./pages/PanelPage"));
const pending = <p className="page-loading" role="status">Carregando…</p>;

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
    return <RetiredAnalysis />;
  }
  if (path === "/login") {
    return <LoginPage />;
  }
  if (path === "/register") {
    return <RegistrationPage />;
  }
  if (path === "/app" || path.startsWith("/app/")) {
    return <Suspense fallback={pending}><PanelPage path={path} /></Suspense>;
  }
  return <ExperiencePage />;
}

/** O envio autenticado substitui a antiga tela de prévia. */
function RetiredAnalysis() {
  useEffect(() => { window.location.replace("/app/files"); }, []);
  return <p role="status">Abrindo o envio de arquivos… <a href="/app/files">Continuar</a></p>;
}
