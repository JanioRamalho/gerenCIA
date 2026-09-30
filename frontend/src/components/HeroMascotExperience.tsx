import { useEffect, useRef, useState, type PointerEvent, type CSSProperties } from "react";
import { categoryRows, demo, formatPercentage, money, type Category } from "./dashboard/demoModel";
import type { MonthKey } from "./dashboard/demoData";
import MascotCalculator from "./MascotCalculator";

type FileId = "pdf" | "csv";
type Phase = "idle" | "chewing" | "result";
type SampleFile = {
  id: FileId;
  name: string;
  extension: string;
  period: MonthKey;
  focus: Category;
};
type DragState = { id: FileId; x: number; y: number };
type DragOrigin = { id: FileId; pointerId: number; x: number; y: number; moved: boolean };

const sampleFiles: SampleFile[] = [
  { id: "pdf", name: "Fatura_Nubank.pdf", extension: "PDF", period: "ago", focus: "Transporte" },
  { id: "csv", name: "Extrato_BB.csv", extension: "CSV", period: "jun", focus: "Alimentação" },
];

function FileSymbol({ extension }: { extension: string }) {
  return <span className="mascot-file-symbol" aria-hidden="true">
    <svg viewBox="0 0 32 38" fill="none">
      <path d="M5 1.5h15l9 9V35a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3.5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" />
      <path d="M20 2v9h9" stroke="currentColor" strokeWidth="2" />
      <path d="M9 18h14M9 23h14M9 28h9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity=".68" />
    </svg>
    <b>{extension}</b>
  </span>;
}

export default function HeroMascotExperience() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedId, setSelectedId] = useState<FileId | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [over, setOver] = useState(false);
  const [attentive, setAttentive] = useState(false);
  const [feedFromDrag, setFeedFromDrag] = useState(false);
  const [feedMotion, setFeedMotion] = useState<CSSProperties | null>(null);
  const [externalNotice, setExternalNotice] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const mascot = useRef<HTMLDivElement>(null);
  const fileRefs = useRef<Record<FileId, HTMLButtonElement | null>>({ pdf: null, csv: null });
  const origin = useRef<DragOrigin | null>(null);
  const suppressClick = useRef(false);
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => () => {
    if (phaseTimer.current) clearTimeout(phaseTimer.current);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
  }, []);

  const hitsMouth = (x: number, y: number) => {
    const rect = mascot.current?.getBoundingClientRect();
    if (!rect) return false;
    return x >= rect.left + rect.width * .28 &&
      x <= rect.left + rect.width * .76 &&
      y >= rect.top + rect.height * .14 &&
      y <= rect.top + rect.height * .54;
  };
  const feed = (id: FileId, fromDrag = false) => {
    if (phase !== "idle") return;
    if (phaseTimer.current) clearTimeout(phaseTimer.current);
    const fileRect = fileRefs.current[id]?.getBoundingClientRect();
    const mascotRect = mascot.current?.getBoundingClientRect();
    if (fileRect && mascotRect && !fromDrag) {
      setFeedMotion({
        "--feed-x": `${mascotRect.left + mascotRect.width * .52 - (fileRect.left + fileRect.width / 2)}px`,
        "--feed-y": `${mascotRect.top + mascotRect.height * .36 - (fileRect.top + fileRect.height / 2)}px`,
      } as CSSProperties);
    } else {
      setFeedMotion(null);
    }
    setFeedFromDrag(fromDrag);
    setSelectedId(id);
    setPhase("chewing");
    setDrag(null);
    setOver(false);
    setAttentive(false);
    phaseTimer.current = setTimeout(() => setPhase("result"), reducedMotion ? 80 : 1320);
  };
  const reset = () => {
    if (phaseTimer.current) clearTimeout(phaseTimer.current);
    setPhase("idle");
    setSelectedId(null);
    setDrag(null);
    setOver(false);
    setAttentive(false);
    setFeedMotion(null);
    setFeedFromDrag(false);
    setExternalNotice(false);
  };
  const trackPointer = (event: PointerEvent<HTMLDivElement>) => {
    if (phase !== "idle" || reducedMotion) return;
    const rect = mascot.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(-2.5, Math.min(2.5, (event.clientX - (rect.left + rect.width / 2)) / 90));
    const y = Math.max(-2, Math.min(2, (event.clientY - (rect.top + rect.height * .33)) / 95));
    event.currentTarget.style.setProperty("--gaze-x", `${x}px`);
    event.currentTarget.style.setProperty("--gaze-y", `${y}px`);
  };
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, id: FileId) => {
    if (phase !== "idle" || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    origin.current = { id, pointerId: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
    setDrag({ id, x: 0, y: 0 });
  };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const current = origin.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const x = event.clientX - current.x;
    const y = event.clientY - current.y;
    if (Math.abs(x) + Math.abs(y) > 7) current.moved = true;
    setDrag({ id: current.id, x, y });
    setOver(hitsMouth(event.clientX, event.clientY));
  };
  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const current = origin.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dropped = current.moved && hitsMouth(event.clientX, event.clientY);
    origin.current = null;
    setDrag(null);
    setOver(false);
    suppressClick.current = current.moved || dropped;
    setTimeout(() => { suppressClick.current = false; }, 0);
    if (dropped) feed(current.id, true);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onPointerCancel = () => {
    origin.current = null;
    setDrag(null);
    setOver(false);
  };
  const onFileClick = (id: FileId) => {
    if (suppressClick.current) return;
    feed(id);
  };
  const onExternalDrop = () => {
    setExternalNotice(true);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setExternalNotice(false), 4200);
  };

  const selected = sampleFiles.find((file) => file.id === selectedId);
  const rows = selected ? categoryRows(selected.period) : [];
  const focus = selected ? rows.find((row) => row.name === selected.focus) : null;
  let totalShare = 0;
  const pie = rows.map((row) => {
    const start = totalShare;
    totalShare += row.share * 100;
    return `${row.color} ${start.toFixed(2)}% ${totalShare.toFixed(2)}%`;
  }).join(", ");

  return <div
    className={`mascot-playground is-${phase}${over ? " is-over" : ""}${attentive && phase === "idle" ? " is-attentive" : ""}${externalNotice && phase === "idle" ? " is-puzzled" : ""}`}
    data-phase={phase}
    onPointerMove={trackPointer}
    onPointerLeave={(event) => {
      setAttentive(false);
      event.currentTarget.style.setProperty("--gaze-x", "0px");
      event.currentTarget.style.setProperty("--gaze-y", "0px");
    }}
    onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => { event.preventDefault(); onExternalDrop(); }}
  >
    <div className="mascot-stage-head">
      <p>Dê algo para ela mastigar.</p>
      <span>Arquivos fictícios · sem upload</span>
    </div>

    <div className="mascot-file-area" aria-label="Arquivos fictícios para experimentar">
      {phase !== "result" && sampleFiles.map((file) => {
        const isDragging = drag?.id === file.id;
        const isFeeding = selectedId === file.id && phase === "chewing";
        const style = {
          ...(isDragging ? { transform: `translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${file.id === "pdf" ? -3 : 3}deg)` } : {}),
          ...(isFeeding && feedMotion ? feedMotion : {}),
        } as CSSProperties;
        return <button
          key={file.id}
          ref={(node) => { fileRefs.current[file.id] = node; }}
          type="button"
          className={`mascot-file mascot-file--${file.id}${isFeeding ? feedFromDrag ? " is-consumed" : " is-feeding" : ""}${isDragging ? " is-dragging" : ""}`}
          data-file={file.id}
          style={style}
          disabled={phase !== "idle"}
          onPointerEnter={() => setAttentive(true)}
          onPointerLeave={() => setAttentive(false)}
          onPointerDown={(event) => onPointerDown(event, file.id)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onClick={() => onFileClick(file.id)}
        >
          <FileSymbol extension={file.extension} />
          <span><strong>{file.name}</strong><small>Arraste ou toque para testar</small></span>
        </button>;
      })}
    </div>

    <div className="mascot-character" ref={mascot}>
      <MascotCalculator />
      <span className="mascot-drop-hint">{over ? "Pode soltar!" : phase === "chewing" ? "Organizando…" : phase === "result" ? "Olha só!" : "Solte na boca"}</span>
    </div>
    {phase === "chewing" && <div className="mascot-digits" aria-hidden="true"><span>8</span><span>0</span><span>%</span><span>2</span></div>}

    {phase === "result" && selected && focus && <div className="mascot-result" role="status" aria-live="polite">
      <div className="mascot-result-top"><span>Leitura ilustrativa</span><span>{demo[selected.period].label} / 2026</span></div>
      <div className="mascot-result-visual">
        <div className="mascot-pie" role="img" aria-label={`Distribuição fictícia de ${demo[selected.period].label.toLowerCase()}: ${focus.name}, ${formatPercentage(focus.share)} do total`} style={{ background: `conic-gradient(${pie})` }}>
          <div><strong>{formatPercentage(focus.share)}</strong><span>do total</span></div>
        </div>
        <div className="mascot-result-category"><i style={{ backgroundColor: focus.color }} /><span>{focus.name}<strong>{money(focus.value)}</strong></span></div>
      </div>
      <p><strong>{focus.name}</strong> representou {formatPercentage(focus.share)} das saídas fictícias de {demo[selected.period].label.toLowerCase()}.</p>
      <button type="button" onClick={reset}>Testar outro arquivo</button>
      <small>Prévia cenográfica. Nenhum arquivo foi lido.</small>
    </div>}

    <div className="mascot-stage-foot" role="status" aria-live="polite">
      <span>{externalNotice ? "Use os arquivos fictícios desta cena. Arquivos reais não são enviados." : phase === "result" ? "Leitura cenográfica concluída. Experimente o outro arquivo." : phase === "chewing" ? "Organizando os números deste exemplo…" : "Arraste até a boca ou toque em um arquivo."}</span>
    </div>
  </div>;
}

