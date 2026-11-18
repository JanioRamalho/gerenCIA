import type { User } from "../../auth/api";
import Icon from "../Icon";

const shortcuts = [
  { href: "/app/files", icon: "files", title: "Arquivos", description: "Importe uma fatura ou um extrato." },
  { href: "/app/transactions", icon: "receipt", title: "Transações", description: "Confira os lançamentos depois de importar." },
  { href: "/app/budgets", icon: "target", title: "Limites", description: "Defina um teto mensal para suas categorias." },
] as const;

export default function PanelHome({ user }: { user: User }) {
  const firstName = user.name.trim().split(/\s+/)[0];
  return <div className="panel-page">
    <header className="panel-welcome on-night">
      <div>
        <h1>Olá, {firstName}.</h1>
        <p className="lead">Importe uma fatura ou um extrato para ver seus gastos por mês e por categoria.</p>
        <a className="primary-button" href="/app/files"><Icon name="upload" size={18} /> Enviar um arquivo</a>
      </div>
      <div className="panel-welcome-art" aria-hidden="true"><span /><span /><span /></div>
    </header>
    <section className="panel-stack" aria-labelledby="shortcuts-title">
      <h2 className="panel-section-title" id="shortcuts-title">Acessos rápidos</h2>
      <ul className="panel-shortcuts">
        {shortcuts.map((item) => <li key={item.href}>
          <a className="panel-card panel-shortcut" href={item.href}>
            <span className="panel-icon-tile"><Icon name={item.icon} /></span>
            <div><strong>{item.title}</strong><p>{item.description}</p></div>
            <Icon name="arrow" size={19} />
          </a>
        </li>)}
      </ul>
    </section>
  </div>;
}
