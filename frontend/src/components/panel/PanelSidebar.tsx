import type { User } from "../../auth/api";
import useMobileMenu from "../../hooks/useMobileMenu";
import Brand from "../Brand";

/** Uma seção do menu. `href: null` quer dizer que a seção ainda não foi construída. */
type MenuItem = {
  label: string;
  href: string | null;
};

// Seções do painel, na ordem do menu. As que ainda não existem aparecem sem
// link, com a marca "em breve", para a pessoa saber o que vem por aí.
const MENU_ITEMS: MenuItem[] = [
  { label: "Painel", href: "/app" },
  { label: "Arquivos", href: null },
  { label: "Transações", href: null },
  { label: "Limites", href: null },
  { label: "Conta", href: "/app/account" },
];

type PanelSidebarProps = {
  currentPath: string;
  user: User | null; // null enquanto a sessão é conferida
  signingOut: boolean;
  signOutFailed: boolean;
  onSignOut: () => void;
};

/**
 * Barra lateral do painel: logotipo, menu das seções e, no pé, quem está logado
 * e o botão de sair. Em telas estreitas ela vira uma barra no topo, e o menu
 * fica atrás do botão de menu.
 */
export default function PanelSidebar({ currentPath, user, signingOut, signOutFailed, onSignOut }: PanelSidebarProps) {
  // O mesmo menu do cabeçalho do site: fecha com Esc e quando o foco sai da barra.
  const { menuOpen, menuButton, toggleMenu, closeMenuWhenFocusLeaves } = useMobileMenu();

  let bodyClass = "panel-sidebar-body";
  if (menuOpen) {
    bodyClass = "panel-sidebar-body is-open";
  }

  return <aside className="panel-sidebar on-night" onBlur={closeMenuWhenFocusLeaves}>
    <div className="panel-sidebar-top">
      <Brand href="/app" label="gerenCIA, painel" />
      <button
        ref={menuButton}
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuOpen}
        aria-controls="panel-navigation"
        onClick={toggleMenu}
      ><span /><span /></button>
    </div>

    <div id="panel-navigation" className={bodyClass}>
      <nav aria-label="Seções do painel">
        <ul className="panel-menu">
          {MENU_ITEMS.map((item) => <MenuEntry key={item.label} item={item} currentPath={currentPath} />)}
        </ul>
      </nav>

      {/* Enquanto a sessão é conferida, esta área guarda o espaço mas fica
          invisível, para não piscar vazia. */}
      <div className="panel-account" data-state={user ? "ready" : "loading"}>
        <p className="panel-account-name">{user?.name}</p>
        <p className="panel-account-email">{user?.email}</p>
        <button className="header-pill" type="button" onClick={onSignOut} disabled={signingOut}>
          {signingOut ? "Saindo…" : "Sair"}
        </button>
        {signOutFailed && <p className="panel-account-error" role="alert">Não foi possível sair. Tente de novo.</p>}
      </div>
    </div>
  </aside>;
}

type MenuEntryProps = {
  item: MenuItem;
  currentPath: string;
};

/** Uma linha do menu: link para seções prontas, texto com "em breve" para as futuras. */
function MenuEntry({ item, currentPath }: MenuEntryProps) {
  if (item.href === null) {
    return <li>
      <span className="panel-menu-item is-planned">
        {item.label}
        <small>em breve</small>
      </span>
    </li>;
  }

  // aria-current="page" avisa aos leitores de tela qual seção está aberta.
  const isCurrent = item.href === currentPath;
  return <li>
    <a className="panel-menu-item" href={item.href} aria-current={isCurrent ? "page" : undefined}>{item.label}</a>
  </li>;
}
