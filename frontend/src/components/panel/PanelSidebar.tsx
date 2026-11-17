import { useEffect, useRef, useState, type FocusEvent } from "react";
import type { User } from "../../auth/api";
import Brand from "../Brand";
import Icon, { type IconName } from "../Icon";

/** Seções disponíveis na área autenticada. */
type MenuItem = {
  label: string;
  href: string;
  icon: IconName;
};

// A ordem acompanha o percurso da análise à revisão e configuração.
const MENU_ITEMS: MenuItem[] = [
  { label: "Painel", href: "/app", icon: "tags" },
  { label: "Arquivos", href: "/app/files", icon: "upload" },
  { label: "Transações", href: "/app/transactions", icon: "rows" },
  { label: "Limites", href: "/app/budgets", icon: "columns" },
  { label: "Conta", href: "/app/account", icon: "user" },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  // A tecla Esc fecha o menu aberto e devolve o foco ao botão de menu.
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  function toggleMenu() {
    setMenuOpen(!menuOpen);
  }

  // Quando o foco sai da barra (por exemplo, com Tab ou clicando no conteúdo),
  // o menu do celular fecha, como no cabeçalho do site.
  function closeMenuWhenFocusLeaves(event: FocusEvent<HTMLElement>) {
    const focusStayedInside = event.currentTarget.contains(event.relatedTarget);
    if (!focusStayedInside) {
      setMenuOpen(false);
    }
  }

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

/** O link ativo é identificado também para leitores de tela. */
function MenuEntry({ item, currentPath }: MenuEntryProps) {
  // aria-current="page" avisa aos leitores de tela qual seção está aberta.
  const isCurrent = item.href === currentPath;
  return <li>
    <a className="panel-menu-item" href={item.href} aria-current={isCurrent ? "page" : undefined}><Icon name={item.icon} size={20} />{item.label}</a>
  </li>;
}
