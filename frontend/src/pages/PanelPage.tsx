import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import Icon from "../components/Icon";
import AccountSection from "../components/panel/AccountSection";
import BudgetsSection from "../components/panel/BudgetsSection";
import FilesSection from "../components/panel/FilesSection";
import PanelNotifications from "../components/panel/PanelNotifications";
import PanelOverview from "../components/panel/PanelOverview";
import PanelSidebar from "../components/panel/PanelSidebar";
import TransactionsSection from "../components/panel/TransactionsSection";
import { panelRoutes } from "../panel/routes";

type PanelPageProps = {
  path: string; // endereço atual, por exemplo "/app" ou "/app/account"
};

export default function PanelPage({ path }: PanelPageProps) {
  const { status, user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);

  const [notificationVersion, setNotificationVersion] = useState(0);
  const label = panelRoutes.find((route) => route.path === path)?.label ?? "Painel";

  // Título da aba do navegador.
  useEffect(() => {
    document.title = `${label} | gerenCIA`;
  }, [label]);

  // Quem não está logado não vê o painel: vai para o login. Durante a saída,
  // quem decide o destino é a função signOutAndLeave, por isso o "signingOut".
  useEffect(() => {
    if (status === "anonymous" && !signingOut) {
      window.location.replace("/login");
    }
  }, [status, signingOut]);

  async function signOutAndLeave() {
    setSignOutFailed(false);
    setSigningOut(true);
    try {
      await signOut();
      window.location.replace("/");
    } catch {
      // O servidor não encerrou a sessão, então a pessoa continua no painel.
      setSigningOut(false);
      setSignOutFailed(true);
    }
  }

  function refreshNotifications() {
    setNotificationVersion((value) => value + 1);
  }

  let content: ReactNode;
  if (status === "unavailable") {
    content = <ServerUnavailable />;
  } else if (status !== "authenticated" || user === null) {
    content = <p className="panel-card" role="status">Carregando seu painel…</p>;
  } else if (path === "/app/account") {
    content = <AccountSection user={user} />;
  } else if (path === "/app/files") {
    content = <FilesSection onChanged={refreshNotifications} />;
  } else if (path === "/app/transactions") {
    content = <TransactionsSection onChanged={refreshNotifications} />;
  } else if (path === "/app/budgets") {
    content = <BudgetsSection onChanged={refreshNotifications} />;
  } else if (path === "/app") {
    content = <PanelOverview user={user} />;
  } else {
    content = <PageNotFound />;
  }

  return <div className="panel-shell">
    <a className="skip-link" href="#panel-content">Pular para o conteúdo</a>
    <PanelSidebar
      currentPath={path}
      user={user}
      signingOut={signingOut}
      signOutFailed={signOutFailed}
      onSignOut={signOutAndLeave}
    />
    <main className="panel-main" id="panel-content" tabIndex={-1}>
      {status === "authenticated" && <div className="panel-toolbar">
        <span className="panel-date"><Icon name="calendar" size={18} /> {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date())}</span>
        <PanelNotifications version={notificationVersion} />
      </div>}
      {content}
    </main>
  </div>;
}

/** Aviso mostrado quando a API não respondeu ao conferir a sessão. */
function ServerUnavailable() {
  function tryAgain() {
    window.location.reload();
  }

  return <section className="panel-card panel-message" aria-labelledby="unavailable-title">
    <h1 id="unavailable-title">Não foi possível abrir o painel.</h1>
    <p>O servidor não respondeu. Confira a sua conexão e tente de novo em instantes.</p>
    <button className="primary-button is-night" type="button" onClick={tryAgain}>Tentar de novo</button>
  </section>;
}

/** Aviso para um endereço /app/... que não existe. */
function PageNotFound() {
  return <section className="panel-card panel-message" aria-labelledby="not-found-title">
    <h1 id="not-found-title">Esta página do painel não existe.</h1>
    <p>Confira o endereço ou volte ao início do painel.</p>
    <a className="primary-button is-night" href="/app">Voltar ao painel</a>
  </section>;
}
