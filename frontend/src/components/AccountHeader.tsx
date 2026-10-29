import Brand from "./Brand";

type AccountHeaderProps = {
  switchHref: string; // a outra página de conta: "/login" ou "/register"
  switchLabel: string;
};

/** Cabeçalho das páginas de entrar e de criar conta: logotipo, a outra página e a volta ao início. */
export default function AccountHeader({ switchHref, switchLabel }: AccountHeaderProps) {
  return <header className="site-header on-night"><div className="page-container header-inner">
    <Brand />
    <nav className="account-nav" aria-label="Navegação de conta">
      <a className="text-link" href={switchHref}>{switchLabel}</a>
      <a className="text-link" href="/">Voltar ao início</a>
    </nav>
  </div></header>;
}
