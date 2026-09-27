import { useEffect, useRef, useState, type CSSProperties } from "react";
import { categories, demo, money, monthKeys } from "../dashboard/demoData";

const totals = monthKeys.map((key) => ({
  key,
  name: demo[key].label,
  value: Object.values(demo[key].values).reduce((a, b) => a + b, 0),
}));
const august = totals[2].value;
const difference = totals[1].value - august;
const reduction = ((difference / totals[1].value) * 100).toLocaleString(
  "pt-BR",
  { maximumFractionDigits: 1 },
);
const distribution = categories
  .map((item) => ({ ...item, value: demo.ago.values[item.name] }))
  .sort((a, b) => b.value - a.value);
const slides = [
  {
    kind: "trend",
    label: "Compare períodos",
    title: "Veja o que mudou. Entenda o próximo passo.",
    description:
      "Um mês isolado conta só parte da história. Compare as saídas e descubra quando seus gastos aumentaram ou diminuíram.",
    insight: `Agosto teve ${money(difference)} a menos em saídas que julho.`,
    action: "Comparar os meses",
  },
  {
    kind: "categories",
    label: "Encontre prioridades",
    title: "Seu dinheiro tem um destino. Enxergue cada um.",
    description:
      "Alterne entre barras e pizza para ver valores ou proporções. A mesma informação, pela perspectiva que faz mais sentido para você.",
    insight: "Alimentação representa 41% das saídas de agosto neste exemplo.",
    action: "Explorar as categorias",
  },
  {
    kind: "details",
    label: "Explore os detalhes",
    title: "Do panorama ao lançamento. Em um clique.",
    description:
      "Selecione uma categoria e encontre os exemplos de movimentação relacionados. Os detalhes ajudam a entender o que está por trás de cada valor.",
    insight:
      "Na demonstração, o filtro de alimentação mostra uma compra de R$ 168,30.",
    action: "Experimentar os filtros",
  },
] as const;

function DemoVisual({ kind }: { kind: (typeof slides)[number]["kind"] }) {
  if (kind === "trend")
    return (
      <div className="carousel-visual carousel-trend">
        <span className="visual-eyebrow">Saídas por mês · 2026</span>
        <div className="visual-total">
          <strong>{money(august)}</strong>
          <span>
            −{reduction}% <small>vs. julho</small>
          </span>
        </div>
        <p>Agosto · dados fictícios</p>
        <div className="month-comparison">
          {totals.map((item) => (
            <div
              className={`comparison-row ${item.key === "ago" ? "is-current" : ""}`}
              key={item.key}
            >
              <div>
                <span>{item.name}</span>
                <strong>{money(item.value)}</strong>
              </div>
              <div className="comparison-track">
                <span
                  style={
                    {
                      "--bar-width": `${(item.value / Math.max(...totals.map((month) => month.value))) * 100}%`,
                    } as CSSProperties
                  }
                />
              </div>
            </div>
          ))}
        </div>
        <span className="visual-footnote">
          Três meses. Uma evolução mais fácil de acompanhar.
        </span>
      </div>
    );
  if (kind === "categories")
    return (
      <div className="carousel-visual carousel-distribution">
        <span className="visual-eyebrow">Distribuição de agosto</span>
        <div className="visual-total">
          <strong>
            41<span>%</span>
          </strong>
          <span className="category-highlight">em alimentação</span>
        </div>
        <div className="carousel-category-list">
          {distribution.map((item) => (
            <div key={item.name}>
              <span>
                <i style={{ backgroundColor: item.color }} aria-hidden="true" />
                {item.name}
              </span>
              <strong>{money(item.value)}</strong>
              <small>{Math.round((item.value / august) * 100)}%</small>
            </div>
          ))}
        </div>
        <span className="visual-footnote">
          5 categorias · {money(august)} no período
        </span>
      </div>
    );
  const transaction = demo.ago.transactions[0];
  return (
    <div className="carousel-visual carousel-detail-demo">
      <span className="visual-eyebrow">Exemplo de filtro · Agosto</span>
      <div className="demo-filter-chip">
        <i aria-hidden="true" />
        Alimentação<span>Selecionada</span>
      </div>
      <div className="example-transaction">
        <span className="example-avatar" aria-hidden="true">
          F
        </span>
        <div>
          <strong>{transaction.name}</strong>
          <span>{transaction.detail}</span>
        </div>
        <strong>− {money(transaction.amount)}</strong>
      </div>
      <div className="example-context">
        <span>Total da categoria</span>
        <strong>{money(demo.ago.values[transaction.category])}</strong>
        <p>
          Este lançamento é um dos exemplos do período. O total inclui outras
          saídas fictícias da categoria.
        </p>
      </div>
      <span className="visual-footnote">
        Os exemplos não representam um extrato completo.
      </span>
    </div>
  );
}

export default function DemoCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const [documentVisible, setDocumentVisible] = useState(!document.hidden);
  const region = useRef<HTMLDivElement>(null);
  const playbackIntent = useRef<boolean | null>(null);
  const autoplay =
    playing && !reducedMotion && !hovering && visible && documentVisible;
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) setPlaying(false);
    };
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.25 },
    );
    if (region.current) observer.observe(region.current);
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % slides.length);
    }, 9000);
    return () => window.clearTimeout(timer);
  }, [autoplay, index]);
  const navigate = (next: number, step: number) => {
    setPlaying(false);
    setDirection(step);
    setIndex((next + slides.length) % slides.length);
  };
  return (
    <div
      className="insight-carousel"
      ref={region}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Descobertas com dados demonstrativos"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setPlaying(false)}
      onKeyDown={(event) => {
        if ((event.target as HTMLElement).closest("a")) return;
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          const step = event.key === "ArrowRight" ? 1 : -1;
          navigate(index + step, step);
        }
      }}
    >
      <div
        className="carousel-stage"
        aria-live={playing ? "off" : "polite"}
        aria-atomic="false"
      >
        {slides.map((slide, position) => (
          <article
            key={slide.kind}
            className={`insight-slide insight-slide-${slide.kind} ${index === position ? "is-active" : ""} ${direction < 0 ? "enter-from-left" : ""}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${position + 1} de ${slides.length}: ${slide.label}`}
            aria-hidden={position !== index}
            inert={position !== index}
          >
            <div className="carousel-copy">
              <span className="carousel-eyebrow">
                <span>{String(position + 1).padStart(2, "0")} / 03</span>
                {slide.label}
              </span>
              <h3>{slide.title}</h3>
              <p>{slide.description}</p>
              <div className="carousel-takeaway">
                <span>Uma leitura do exemplo</span>
                <strong>{slide.insight}</strong>
              </div>
              <a className="button carousel-cta" href="#demo">
                {slide.action}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
            <DemoVisual kind={slide.kind} />
          </article>
        ))}
      </div>
      <div className="carousel-controls">
        <div
          className="carousel-tabs"
          role="group"
          aria-label="Escolher exemplo demonstrativo"
        >
          {slides.map((item, position) => (
            <button
              key={item.kind}
              type="button"
              aria-label={`Mostrar exemplo ${position + 1}: ${item.label}`}
              aria-pressed={index === position}
              onClick={() => navigate(position, position < index ? -1 : 1)}
            >
              <span className="carousel-tab-number" aria-hidden="true">
                0{position + 1}
              </span>
              <span>{item.label}</span>
              {position === index && (
                <span
                  key={`${index}-${autoplay}`}
                  className={`carousel-progress ${autoplay ? "is-running" : ""}`}
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
        <div className="carousel-navigation">
          {!reducedMotion ? (
            <button
              className="carousel-play"
              type="button"
              aria-label={
                playing ? "Pausar carrossel" : "Ativar reprodução automática"
              }
              onPointerDown={() => {
                playbackIntent.current = !playing;
              }}
              onPointerCancel={() => {
                playbackIntent.current = null;
              }}
              onPointerLeave={() => {
                playbackIntent.current = null;
              }}
              onBlur={() => {
                playbackIntent.current = null;
              }}
              onClick={() => {
                setPlaying(playbackIntent.current ?? !playing);
                playbackIntent.current = null;
              }}
            >
              <span
                className={playing ? "pause-glyph" : "play-glyph"}
                aria-hidden="true"
              />
              {playing ? "Pausar" : "Reproduzir"}
            </button>
          ) : (
            <span className="carousel-manual">Navegação manual</span>
          )}
          <div className="carousel-arrows">
            <button
              type="button"
              aria-label="Exemplo anterior"
              onClick={() => navigate(index - 1, -1)}
            >
              <span aria-hidden="true">←</span>
            </button>
            <button
              type="button"
              aria-label="Próximo exemplo"
              onClick={() => navigate(index + 1, 1)}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
      <p className="carousel-disclaimer">
        Demonstração com dados fictícios. Explore esses mesmos exemplos na
        dashboard abaixo.
      </p>
    </div>
  );
}
