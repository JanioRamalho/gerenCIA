import { useEffect, useRef, useState, type FocusEvent } from "react";
import type { User } from "../../auth/api";
import { panelRoutes } from "../../panel/routes";
import Brand from "../Brand";
import Icon from "../Icon";

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

  const initials = user?.name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toLocaleUpperCase("pt-BR");

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

    <div id="panel-navigation" className={`panel-sidebar-body${menuOpen ? " is-open" : ""}`}>
      <nav aria-label="Seções do painel">
        <ul className="panel-menu">
          {panelRoutes.map((item) => <li key={item.path}>
            <a className="panel-menu-item" href={item.path} aria-current={item.path === currentPath ? "page" : undefined}>
              <Icon name={item.icon} size={20} />{item.label}
            </a>
          </li>)}
        </ul>
      </nav>

      {/* Enquanto a sessão é conferida, esta área guarda o espaço mas fica
          invisível, para não piscar vazia. */}
      <div className="panel-account" data-state={user ? "ready" : "loading"}>
        <div className="panel-identity">
          <span className="panel-avatar" aria-hidden="true">{initials}</span>
          <div><p className="panel-account-name">{user?.name}</p><p className="panel-account-email">{user?.email}</p></div>
        </div>
        <button className="header-pill" type="button" onClick={onSignOut} disabled={signingOut}>
          {signingOut ? "Saindo…" : "Sair"}
        </button>
        {signOutFailed && <p className="panel-account-error" role="alert">Não foi possível sair. Tente de novo.</p>}
      </div>
    </div>
  </aside>;
}
