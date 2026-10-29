import type { MouseEvent, ReactNode } from "react";
import { demoHref } from "../hooks/useDemoExperience";
import type { DemoPreset } from "./dashboard/demoModel";

type DemoLinkProps = {
  preset: DemoPreset; // o recorte que o link abre
  onOpen: (preset: DemoPreset) => void;
  className: string;
  children: ReactNode;
};

/**
 * Link das figuras que abre um recorte da demonstração. Com um clique simples,
 * a demonstração muda nesta mesma página, sem recarregar. Com Ctrl, Cmd, Shift
 * ou o botão do meio, o link segue o endereço normal e abre em outra aba.
 */
export default function DemoLink({ preset, onOpen, className, children }: DemoLinkProps) {
  function openInThisPage(event: MouseEvent<HTMLAnchorElement>) {
    const usedModifierKey = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
    const isPlainClick = !usedModifierKey && event.button === 0;
    if (!isPlainClick) {
      return;
    }
    event.preventDefault();
    onOpen(preset);
  }

  return <a className={className} href={demoHref(preset)} onClick={openInThisPage}>{children}</a>;
}
