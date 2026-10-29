import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import useMobileMenu from "../../hooks/useMobileMenu";
import Brand from "../Brand";
import { sectionLinks } from "./sectionLinks";

/**
 * Cabeçalho da página inicial: logotipo, links para as seções e, para quem não
 * está logado, os links de entrar e cadastrar. Em telas estreitas, os links
 * ficam atrás do botão de menu.
 */
export default function SiteHeader() {
  const { status } = useAuth();
  const { menuOpen, menuButton, toggleMenu, closeMenu, closeMenuWhenFocusLeaves } = useMobileMenu();
  const currentSection = useCurrentSection();

  return <header className="site-header on-night" onBlur={closeMenuWhenFocusLeaves}>
    <div className="page-container header-inner">
      <Brand />
      <button
        ref={menuButton}
        className="menu-toggle"
        type="button"
        aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuOpen}
        aria-controls="site-navigation"
        onClick={toggleMenu}
      ><span /><span /></button>
      <nav id="site-navigation" className={menuOpen ? "site-nav is-open" : "site-nav"} aria-label="Navegação principal">
        <ol>
          {sectionLinks.map((item) => <li key={item.href}>
            {/* aria-current="location" avisa aos leitores de tela em que seção a pessoa está. */}
            <a href={item.href} onClick={closeMenu} aria-current={currentSection === item.href ? "location" : undefined}>{item.label}</a>
          </li>)}
        </ol>
        {/* Quem está logado já está a caminho do painel, então só visitantes veem estes links. */}
        <div className="nav-account" data-state={status}>
          {status !== "authenticated" && <><a className="nav-signin" href="/login">Entrar</a><a className="header-pill" href="/register">Cadastrar</a></>}
        </div>
      </nav>
    </div>
  </header>;
}

/** O link da seção que está passando pelo meio da tela, por exemplo "#demo". */
function useCurrentSection(): string | null {
  const [currentSection, setCurrentSection] = useState<string | null>(null);

  useEffect(() => {
    // IntersectionObserver avisa quando um elemento entra ou sai de uma área da
    // tela. O rootMargin encolhe essa área para uma faixa no meio da tela.
    const observer = new IntersectionObserver((records) => {
      for (const record of records) {
        if (record.isIntersecting) {
          setCurrentSection(`#${record.target.id}`);
        }
      }
    }, { rootMargin: "-45% 0px -50% 0px" });

    for (const link of sectionLinks) {
      const section = document.querySelector(link.href);
      if (section) {
        observer.observe(section);
      }
    }
    return () => observer.disconnect();
  }, []);

  return currentSection;
}
