import { useEffect, useRef, useState, type FocusEvent } from "react";

/**
 * O menu que, em telas estreitas, fica atrás do botão de menu. Ele fecha com a
 * tecla Esc, devolvendo o foco ao botão, e quando o foco sai da área do menu.
 * Usado no cabeçalho do site e na barra lateral do painel.
 */
export default function useMobileMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  // Referência ao botão de menu, para devolver o foco a ele.
  const menuButton = useRef<HTMLButtonElement>(null);

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

  function closeMenu() {
    setMenuOpen(false);
  }

  // Quando o foco sai da área do menu (por exemplo, com Tab ou clicando no
  // conteúdo), o menu fecha. relatedTarget é o elemento que recebe o foco.
  function closeMenuWhenFocusLeaves(event: FocusEvent<HTMLElement>) {
    const focusStayedInside = event.currentTarget.contains(event.relatedTarget);
    if (!focusStayedInside) {
      setMenuOpen(false);
    }
  }

  return { menuOpen, menuButton, toggleMenu, closeMenu, closeMenuWhenFocusLeaves };
}
