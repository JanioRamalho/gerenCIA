import type { User } from "../../auth/api";
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
