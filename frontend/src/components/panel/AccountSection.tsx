import { useState, type FormEvent } from "react";
import { ApiError, type User } from "../../auth/api";
import { useAuth } from "../../auth/AuthContext";
import { leaveIfSignedOut, money } from "../../panel/api";
import Icon from "../Icon";
import { formatDate } from "./formatDate";

type AccountSectionProps = {
  user: User;
};

/** Página /app/account: os dados do cadastro e como a conta é protegida. */
export default function AccountSection({ user }: AccountSectionProps) {
  return <div className="panel-page">
    <header className="panel-page-head">
      <h1>Conta</h1>
      <p className="lead">Confira seus dados de cadastro e as informações da sua sessão.</p>
    </header>

    <div className="panel-grid">
      <section className="panel-card panel-stack" aria-labelledby="account-data-title">
        <span className="panel-icon-tile"><Icon name="user" /></span>
        <h2 id="account-data-title">Dados da conta</h2>
        <dl className="panel-facts is-wide">
          <div><dt>Nome</dt><dd>{user.name}</dd></div>
          <div><dt>E-mail</dt><dd>{user.email}</dd></div>
          <div><dt>Conta criada em</dt><dd>{formatDate(user.created_at)}</dd></div>
        </dl>
      </section>

      <IncomeForm user={user} />

      <section className="panel-card panel-stack" aria-labelledby="account-privacy-title">
        <span className="panel-icon-tile"><Icon name="check" /></span>
        <h2 id="account-privacy-title">Acesso e privacidade</h2>
        <dl className="panel-facts">
          <div><dt>Sessão</dt><dd>Fica aberta neste navegador até você sair ou até ela expirar.</dd></div>
          <div><dt>Senha</dt><dd>Protegida por hash no servidor.</dd></div>
          <div><dt>Importações</dt><dd>Você pode revisar e remover seus dados importados na seção <a className="xref" href="/app/files">Arquivos</a>.</dd></div>
        </dl>
      </section>
    </div>
  </div>;
}

/** Renda mensal opcional: dá contexto ao perfil de gastos calculado pela IA. */
function IncomeForm({ user }: { user: User }) {
  const { updateIncome } = useAuth();
  const [value, setValue] = useState(user.monthly_income?.replace(".", ",") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function save(remove: boolean) {
    if (busy) return;
    const raw = value.trim();
    // Aceita "5000", "5000,00" e "5.000,00".
    const input = /^\d{1,3}(\.\d{3}){1,3}(,\d{1,2})?$/.test(raw) ? raw.replaceAll(".", "") : raw;
    if (!remove && (!/^\d{1,12}([,.]\d{1,2})?$/.test(input) || Number(input.replace(",", ".")) <= 0)) {
      setError("Informe um valor maior que zero, com até duas casas decimais.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await updateIncome(remove ? null : input.replace(",", "."));
      if (remove) setValue("");
      setMessage(remove ? "Renda removida." : "Renda salva.");
    } catch (failure) {
      if (!leaveIfSignedOut(failure)) setError(failure instanceof ApiError ? failure.message : "Não foi possível salvar a renda.");
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void save(false);
  }

  return <section className="panel-card panel-stack" aria-labelledby="account-income-title">
    <span className="panel-icon-tile"><Icon name="target" /></span>
    <h2 id="account-income-title">Renda mensal</h2>
    <p className="pd-hint">Opcional. O perfil de gastos usa a renda para mostrar quanto dela os seus gastos costumam comprometer.
      {user.monthly_income !== null && <> Valor atual: <strong>{money(user.monthly_income)}</strong>.</>}</p>
    <form className="panel-stack" onSubmit={submit}>
      <label className="panel-field">Renda mensal (R$)
        <input inputMode="decimal" maxLength={18} required value={value} disabled={busy} placeholder="5.000,00" onChange={(event) => setValue(event.target.value)} />
      </label>
      {error && <p className="pd-error" role="alert">{error}</p>}
      <p className="sr-only" role="status">{message}</p>
      {message && <p className="pd-hint" aria-hidden="true">{message}</p>}
      <div className="action-row">
        <button className="primary-button is-night" type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar renda"}</button>
        {user.monthly_income !== null && <button className="text-button panel-danger" type="button" disabled={busy} onClick={() => void save(true)}>Remover renda</button>}
      </div>
    </form>
  </section>;
}
