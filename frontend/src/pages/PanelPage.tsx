import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import AccountSection from "../components/panel/AccountSection";
import PanelHome from "../components/panel/PanelHome";
import PanelSidebar from "../components/panel/PanelSidebar";

const HOME_PATH = "/app";
const ACCOUNT_PATH = "/app/account";

type PanelPageProps = {
  path: string; // endereço atual, por exemplo "/app" ou "/app/account"
};

/**
 * Painel do usuário: a área de quem está logado.
 *
 * Confere a sessão, manda quem não está logado para o /login e mostra a seção
 * pedida pelo endereço: o início do painel (/app) ou os dados da conta
 * (/app/account).
 */
export default function PanelPage({ path }: PanelPageProps) {
  const { status, user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);

  const isAccountPage = path === ACCOUNT_PATH;

  // Título da aba do navegador.
  useEffect(() => {
    if (isAccountPage) {
      document.title = "Conta | gerenCIA";
    } else {
      document.title = "Painel | gerenCIA";
    }
  }, [isAccountPage]);

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

  // Escolhe o conteúdo da área principal conforme a sessão e o endereço.
  let content;
  if (status === "unavailable") {
    content = <ServerUnavailable />;
  } else if (status !== "authenticated" || user === null) {
    // Sessão ainda sendo conferida (ou a caminho do login): a área fica vazia,
    // e só os leitores de tela ouvem o aviso.
    content = <p className="sr-only" role="status">Carregando seu painel…</p>;
  } else if (isAccountPage) {
    content = <AccountSection user={user} />;
  } else if (path === HOME_PATH) {
    content = <PanelHome user={user} />;
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
    <main className="panel-main" id="panel-content" tabIndex={-1}>{content}</main>
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
    <a className="primary-button is-night" href={HOME_PATH}>Voltar ao painel</a>
  </section>;
}
