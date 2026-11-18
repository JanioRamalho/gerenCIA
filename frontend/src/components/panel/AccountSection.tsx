import { useRef, useState, type FormEvent } from "react";
import { deleteAccount, type User } from "../../auth/api";
import { leaveIfSignedOut } from "../../panel/api";
import { formatDate } from "./formatDate";
import "../../styles/panel-tasks.css";

type AccountSectionProps = {
  user: User;
};

/** Página /app/account: os dados do cadastro e como a conta é protegida. */
export default function AccountSection({ user }: AccountSectionProps) {
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const confirmInput = useRef<HTMLInputElement>(null);
  async function remove(event: FormEvent) {
    event.preventDefault();
    if (!confirmed || busy) return;
    setBusy(true);
    setError("");
    try {
      await deleteAccount();
      window.location.replace("/");
    }
    catch (failure) {
      if (!leaveIfSignedOut(failure)) setError(failure instanceof Error ? failure.message : "Não foi possível excluir sua conta. Seus dados permanecem disponíveis.");
      setBusy(false);
    }
  }
  return <div className="panel-page gc-task-page gc-account-page">
    <header className="panel-page-head">
      <h1>Conta</h1>
      <p className="lead">Os dados que você informou no cadastro.</p>
    </header>

    <div className="gc-account-sections">
      <section className="panel-card" aria-labelledby="account-data-title">
        <h2 id="account-data-title">Dados da conta</h2>
        <dl className="panel-facts is-wide">
          <div>
            <dt>Nome</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Conta criada em</dt>
            <dd>{formatDate(user.created_at)}</dd>
          </div>
        </dl>
      </section>

      {/* Cada frase descreve o que o sistema já faz hoje (veja backend/README.md). */}
      <section className="panel-card" aria-labelledby="account-privacy-title">
        <h2 id="account-privacy-title">Acesso e privacidade</h2>
        <dl className="panel-facts">
          <div>
            <dt>Sessão</dt>
            <dd>Fica aberta neste navegador até você sair ou até ela expirar.</dd>
          </div>
          <div>
            <dt>Senha</dt>
            <dd>Guardada só como um código irreversível, que não permite descobrir a senha.</dd>
          </div>
          <div>
            <dt>Seus dados</dt>
            <dd>Nenhum outro usuário tem acesso a eles.</dd>
          </div>
        </dl>
      </section>
    </div>
    <section className="gc-surface gc-danger-zone" aria-labelledby="delete-account-heading">
      <h2 id="delete-account-heading">Excluir sua conta</h2>
      <p>Seus arquivos importados, transações, regras, limites e avisos serão excluídos. Todas as suas sessões serão encerradas. Esta ação não pode ser desfeita.</p>
      {confirming ? <form className="gc-edit-form" onSubmit={remove}>
        <label className="gc-checkbox">
          <input ref={confirmInput} autoFocus type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Entendo que a conta e os dados serão excluídos definitivamente.</label>
        <div className="gc-filter-actions">
          <button className="gc-button gc-button-danger" disabled={!confirmed || busy}>{busy ? "Excluindo…" : "Excluir definitivamente"}</button>
          <button className="text-button" type="button" disabled={busy} onClick={() => {
            setConfirming(false);
            setConfirmed(false);
            setError("");
          }}>Cancelar</button>
        </div>
      </form> : <button className="text-button" onClick={() => setConfirming(true)}>Solicitar exclusão da conta</button>}
      {error ? <p className="pd-error" role="alert">{error}</p> : null}
    </section>
  </div>;
}
