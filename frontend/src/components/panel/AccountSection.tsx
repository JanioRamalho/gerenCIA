import type { User } from "../../auth/api";
import { formatDate } from "./formatDate";

type AccountSectionProps = {
  user: User;
};

/** Página /app/account: os dados do cadastro e como a conta é protegida. */
export default function AccountSection({ user }: AccountSectionProps) {
  return <div className="panel-page">
    <header className="panel-page-head">
      <h1>Conta</h1>
      <p className="lead">Os dados que você informou no cadastro.</p>
    </header>

    <div className="panel-grid">
      <section className="panel-card" aria-labelledby="account-data-title">
        <h2 id="account-data-title">Dados da conta</h2>
        <dl className="panel-facts is-wide">
          <div><dt>Nome</dt><dd>{user.name}</dd></div>
          <div><dt>E-mail</dt><dd>{user.email}</dd></div>
          <div><dt>Conta criada em</dt><dd>{formatDate(user.created_at)}</dd></div>
        </dl>
        <p className="status-line panel-card-foot"><i className="status-mark" aria-hidden="true" />Excluir a conta, com todos os seus dados: em breve.</p>
      </section>

      {/* Cada frase descreve o que o sistema já faz hoje (veja backend/README.md). */}
      <section className="panel-card" aria-labelledby="account-privacy-title">
        <h2 id="account-privacy-title">Acesso e privacidade</h2>
        <dl className="panel-facts">
          <div><dt>Sessão</dt><dd>Fica aberta neste navegador até você sair ou até ela expirar.</dd></div>
          <div><dt>Senha</dt><dd>Guardada só como um código irreversível, que não permite descobrir a senha.</dd></div>
          <div><dt>Seus dados</dt><dd>Nenhum outro usuário tem acesso a eles.</dd></div>
        </dl>
      </section>
    </div>
  </div>;
}
