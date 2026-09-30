import type { MouseEvent } from "react";
import { storySteps, type DemoPreset } from "./dashboard/demoModel";
import HeroMascotExperience from "./HeroMascotExperience";
import UiArrow from "./UiArrow";
import { demoHref } from "../hooks/useDemoExperience";

const demoPreset = storySteps[0].preset;

export default function HeroStory({ onOpenPreset }: { onOpenPreset: (preset: DemoPreset) => void }) {
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onOpenPreset(demoPreset);
  };

  return <section className="hero hero--mascot" id="visao-geral" aria-labelledby="hero-title">
    <div className="page-container hero-grid">
      <div className="hero-copy">
        <h1 id="hero-title">Sua fatura diz mais que o total.</h1>
        <p className="hero-lede">Dê um arquivo fictício para a calculadorazinha e descubra o que meses, categorias e lançamentos podem contar.</p>
        <div className="hero-actions">
          <a className="primary-button" href={demoHref(demoPreset)} onClick={open}>Explorar demonstração <UiArrow direction="diagonal" /></a>
          <a className="quiet-link" href="#como-funciona">Como funciona</a>
        </div>
        <p className="hero-disclaimer">Cena ilustrativa. Nenhum arquivo é enviado.</p>
      </div>
      <div className="flow-stage"><HeroMascotExperience /></div>
    </div>
  </section>;
}
