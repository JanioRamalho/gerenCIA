import { useRef, useState, type MouseEvent, type TouchEvent } from "react";
import { categoryRows, demo, formatPercentage, money, monthColors, monthRows, monthlyDelta, storySteps, totalOf, type DemoPreset } from "./dashboard/demoModel";
import { demoHref } from "../hooks/useDemoExperience";
import UiArrow from "./UiArrow";

function InsightVisual({ index }: { index: number }) {
  if (index === 0) {
    const maximum = Math.max(...monthRows.map((row) => row.total));
    const delta = monthlyDelta("ago")!;
    return <div className="insight-visual insight-trend">
      <div className="insight-visual-head"><span>Saídas mensais · 2026</span><strong>{formatPercentage(delta.percentage / 100)} vs. julho</strong></div>
      <div className="mini-months">{monthRows.map((row) => <div key={row.key}>
        <div className="mini-month-rail"><span style={{ height: `${row.total / maximum * 100}%`, backgroundColor: monthColors[row.key] }} /></div>
        <b>{row.label}</b><strong>{money(row.total)}</strong>
      </div>)}</div>
      <p>Agosto teve {money(Math.abs(delta.amount))} a menos em saídas que julho.</p>
    </div>;
  }
  if (index === 1) {
    const rows = categoryRows("ago").sort((a, b) => b.value - a.value);
    const maximum = rows[0].value;
    return <div className="insight-visual insight-categories">
      <div className="insight-visual-head"><span>Distribuição de agosto</span><strong>{money(totalOf(demo.ago.values))}</strong></div>
      <div className="mini-category-list">{rows.map((row) => <div key={row.name}>
        <span className="mini-category-name"><i style={{ backgroundColor: row.color }} />{row.name}</span>
        <span className="mini-category-track"><i style={{ width: `${row.value / maximum * 100}%`, backgroundColor: row.color }} /></span>
        <strong>{formatPercentage(row.share)}</strong>
      </div>)}</div>
      <p>Alimentação concentra a maior parte das saídas neste período.</p>
    </div>;
  }
  const transaction = demo.ago.transactions.find((item) => item.category === "Alimentação")!;
  return <div className="insight-visual insight-transactions">
    <div className="insight-visual-head"><span>Alimentação · agosto</span><strong>{money(demo.ago.values.Alimentação)}</strong></div>
    <div className="mini-transaction"><span className="mini-transaction-mark">{transaction.name.charAt(0)}</span><span><strong>{transaction.name}</strong><small>{transaction.detail}</small></span><b>{money(transaction.amount)}</b></div>
    <p>Este lançamento é um exemplo. O total inclui outras saídas fictícias da categoria.</p>
  </div>;
}

export default function InsightCarousel({ onOpenPreset }: { onOpenPreset: (preset: DemoPreset) => void }) {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const step = storySteps[index];
  const go = (next: number) => setIndex((next + storySteps.length) % storySteps.length);
  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onOpenPreset(step.preset);
  };
  const onTouchStart = (event: TouchEvent) => { touchStart.current = event.touches[0]?.clientX ?? null; };
  const onTouchEnd = (event: TouchEvent) => {
    if (touchStart.current === null) return;
    const distance = event.changedTouches[0]?.clientX - touchStart.current;
    if (Math.abs(distance) > 55) go(index + (distance < 0 ? 1 : -1));
    touchStart.current = null;
  };
  return <div className="insight-carousel" role="region" aria-roledescription="carrossel" aria-label="Descobertas com dados fictícios" onKeyDown={(event) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      go(index + (event.key === "ArrowRight" ? 1 : -1));
    }
  }}>
    <div className="insight-carousel-top"><p>Três maneiras de ler o mesmo cenário</p><div><button type="button" aria-label="Descoberta anterior" onClick={() => go(index - 1)}><UiArrow direction="left" /></button><button type="button" aria-label="Próxima descoberta" onClick={() => go(index + 1)}><UiArrow /></button></div></div>
    <div className="insight-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-live="polite">
      <article className="insight-slide" role="group" aria-roledescription="slide" aria-label={`${index + 1} de ${storySteps.length}: ${step.label}`} key={step.key}>
        <div className="insight-copy"><span className="insight-count">{String(index + 1).padStart(2, "0")} / 03</span><h3>{step.title}.</h3><p>{step.description}</p><a className="secondary-button" href={demoHref(step.preset)} onClick={open}>Abrir análise de {step.label.toLowerCase()} <UiArrow direction="diagonal" /></a></div>
        <InsightVisual index={index} />
      </article>
    </div>
    <div className="insight-pagination" role="group" aria-label="Escolher descoberta">{storySteps.map((item, position) => <button key={item.key} type="button" aria-pressed={index === position} onClick={() => go(position)}><span>{item.label}</span><i aria-hidden="true" /></button>)}</div>
    <p className="insight-disclaimer">Os valores vêm da mesma demonstração fictícia abaixo. Os lançamentos mostrados são apenas exemplos.</p>
  </div>;
}
