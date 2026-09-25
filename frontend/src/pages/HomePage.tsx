import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Category =
  | "Alimentação"
  | "Transporte"
  | "Lazer"
  | "Assinaturas"
  | "Outros";
type MonthKey = "jun" | "jul" | "ago";
type Period = MonthKey | "quarter";

type Transaction = {
  name: string;
  detail: string;
  category: Category;
  amount: number;
};

const categories: { name: Category; color: string }[] = [
  { name: "Alimentação", color: "#F2A16B" },
  { name: "Transporte", color: "#42B9AD" },
  { name: "Lazer", color: "#9889D9" },
  { name: "Assinaturas", color: "#E8BA53" },
  { name: "Outros", color: "#7299A8" },
];

const demo: Record<
  MonthKey,
  {
    label: string;
    values: Record<Category, number>;
    transactions: Transaction[];
  }
> = {
  jun: {
    label: "Junho",
    values: {
      Alimentação: 1248.4,
      Transporte: 688.6,
      Lazer: 492,
      Assinaturas: 179.7,
      Outros: 367.3,
    },
    transactions: [
      {
        name: "Mercado da Vila",
        detail: "18 jun · Compra no débito",
        category: "Alimentação",
        amount: 248.9,
      },
      {
        name: "Uber",
        detail: "15 jun · Mobilidade",
        category: "Transporte",
        amount: 36.4,
      },
      {
        name: "Cinema Lumière",
        detail: "12 jun · Entretenimento",
        category: "Lazer",
        amount: 76,
      },
      {
        name: "Spotify",
        detail: "08 jun · Cobrança recorrente",
        category: "Assinaturas",
        amount: 21.9,
      },
      {
        name: "Farmácia Central",
        detail: "04 jun · Compra no débito",
        category: "Outros",
        amount: 84.6,
      },
    ],
  },
  jul: {
    label: "Julho",
    values: {
      Alimentação: 1375.2,
      Transporte: 572.8,
      Lazer: 624.5,
      Assinaturas: 179.7,
      Outros: 458.8,
    },
    transactions: [
      {
        name: "Mercado da Vila",
        detail: "23 jul · Compra no débito",
        category: "Alimentação",
        amount: 312.7,
      },
      {
        name: "99",
        detail: "19 jul · Mobilidade",
        category: "Transporte",
        amount: 28.5,
      },
      {
        name: "Teatro Municipal",
        detail: "16 jul · Entretenimento",
        category: "Lazer",
        amount: 110,
      },
      {
        name: "Netflix",
        detail: "10 jul · Cobrança recorrente",
        category: "Assinaturas",
        amount: 44.9,
      },
      {
        name: "Papelaria Horizonte",
        detail: "05 jul · Compra no débito",
        category: "Outros",
        amount: 69.4,
      },
    ],
  },
  ago: {
    label: "Agosto",
    values: {
      Alimentação: 1186.7,
      Transporte: 734.3,
      Lazer: 418.5,
      Assinaturas: 179.7,
      Outros: 393.8,
    },
    transactions: [
      {
        name: "Feira do Bairro",
        detail: "27 ago · Compra no débito",
        category: "Alimentação",
        amount: 168.3,
      },
      {
        name: "Uber",
        detail: "21 ago · Mobilidade",
        category: "Transporte",
        amount: 42.8,
      },
      {
        name: "Café e Livros",
        detail: "18 ago · Entretenimento",
        category: "Lazer",
        amount: 58.5,
      },
      {
        name: "Spotify",
        detail: "08 ago · Cobrança recorrente",
        category: "Assinaturas",
        amount: 21.9,
      },
      {
        name: "Pet Shop Amigo",
        detail: "03 ago · Compra no débito",
        category: "Outros",
        amount: 96.7,
      },
    ],
  },
};

const monthKeys: MonthKey[] = ["jun", "jul", "ago"];
const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

function Logo({ light = false }: { light?: boolean }) {
  return (
    <a
      className={`logo ${light ? "logo-light" : ""}`}
      href="/"
      aria-label="Gerencia, início"
    >
      <span className="logo-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        geren<span className="logo-emphasis">CIA</span>
        <span className="logo-dot">.</span>
      </span>
    </a>
  );
}

function ArrowIcon({ diagonal = false }: { diagonal?: boolean }) {
  return diagonal ? (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M4.5 15.5 15 5M6 5h9v9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M3 10h13m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DemoDashboard() {
  const [period, setPeriod] = useState<Period>("ago");
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const values = useMemo(() => {
    if (period !== "quarter") return demo[period].values;
    return Object.fromEntries(
      categories.map(({ name }) => [
        name,
        monthKeys.reduce((sum, key) => sum + demo[key].values[name], 0),
      ]),
    ) as Record<Category, number>;
  }, [period]);

  const total = Object.values(values).reduce((sum, value) => sum + value, 0);
  const [animatedTotal, setAnimatedTotal] = useState(total);
  const previousTotal = useRef(total);

  useEffect(() => {
    const from = previousTotal.current;
    previousTotal.current = total;
    if (
      !hasInteracted ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setAnimatedTotal(total);
      return;
    }
    let frame = 0;
    let start = 0;
    const duration = 720;
    const tick = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedTotal(from + (total - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [total, hasInteracted]);

  const chartData = categories.map(({ name, color }) => ({
    name,
    value: values[name],
    color,
  }));
  const selectedLabel =
    period === "quarter"
      ? "Junho a agosto de 2026"
      : demo[period].label + " de 2026";
  const topCategory = [...chartData].sort((a, b) => b.value - a.value)[0];
  const displayedTransactions = (
    period === "quarter"
      ? monthKeys.flatMap((key) => demo[key].transactions)
      : demo[period].transactions
  )
    .filter(
      (transaction) =>
        !activeCategory || transaction.category === activeCategory,
    )
    .slice(0, 4);
  const previousMonthTotal =
    period === "jul"
      ? Object.values(demo.jun.values).reduce((a, b) => a + b, 0)
      : period === "ago"
        ? Object.values(demo.jul.values).reduce((a, b) => a + b, 0)
        : null;
  const delta =
    previousMonthTotal === null
      ? null
      : Math.round(((total - previousMonthTotal) / previousMonthTotal) * 100);
  const deltaText =
    period === "quarter"
      ? "Três meses no recorte"
      : period === "jun"
        ? "Primeiro mês do recorte"
        : (delta! > 0 ? "+" : "") + delta + "% vs. mês anterior";

  const selectPeriod = (next: Period) => {
    if (next === period) return;
    setHasInteracted(true);
    setPeriod(next);
    setActiveCategory(null);
  };

  return (
    <div
      className="dashboard"
      aria-label="Demonstração de análise financeira com dados fictícios"
    >
      <div className="dashboard-head">
        <div className="dash-identity">
          <span className="dash-brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <div>
            <span className="dash-path">gerenCIA / Análise</span>
            <h3>Visão do extrato</h3>
          </div>
        </div>
        <div className="dash-head-actions">
          <span className="demo-status">
            <span /> Dados fictícios
          </span>
          <div
            className="period-filter"
            role="group"
            aria-label="Filtrar período da demonstração"
          >
            {monthKeys.map((key) => (
              <button
                key={key}
                type="button"
                className={period === key ? "active" : ""}
                onClick={() => selectPeriod(key)}
                aria-pressed={period === key}
              >
                {demo[key].label}
              </button>
            ))}
            <button
              type="button"
              className={period === "quarter" ? "active" : ""}
              onClick={() => selectPeriod("quarter")}
              aria-pressed={period === "quarter"}
            >
              3 meses
            </button>
          </div>
        </div>
        <span
          key={period}
          className={
            hasInteracted ? "dashboard-refresh animate" : "dashboard-refresh"
          }
          aria-hidden="true"
        />
      </div>

      <div className="dashboard-metrics">
        <div className="metric-primary">
          <span className="metric-label">Total de saídas</span>
          <strong aria-label={money(total)}>
            <span aria-hidden="true">{money(animatedTotal)}</span>
          </strong>
          <span className="metric-period">{selectedLabel}</span>
          <svg
            className="metric-sparkline"
            viewBox="0 0 112 46"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 36 29 26 55 31 80 12 109 18"
              stroke="#83DCCE"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 36 29 26 55 31 80 12 109 18V46H3Z"
              fill="url(#sparkFade)"
            />
            <defs>
              <linearGradient id="sparkFade" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#83DCCE" stopOpacity=".32" />
                <stop offset="1" stopColor="#83DCCE" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="metric-secondary">
          <span className="metric-label">Leitura do período</span>
          <strong
            className={delta !== null && delta > 0 ? "delta-up" : "delta-down"}
          >
            {deltaText}
          </strong>
          <small>
            {delta !== null && delta > 0
              ? "As saídas aumentaram"
              : delta !== null
                ? "As saídas diminuíram"
                : "Acompanhe a evolução mensal"}
          </small>
        </div>
        <div className="metric-secondary">
          <span className="metric-label">Assinaturas</span>
          <strong>{money(values.Assinaturas)}</strong>
          <small>Identificadas neste recorte</small>
        </div>
        <div className="metric-secondary metric-leader">
          <span className="metric-label">Categoria principal</span>
          <strong>
            <span
              className="leader-dot"
              style={{ backgroundColor: topCategory.color }}
            />
            {topCategory.name}
          </strong>
          <small>
            {Math.round((topCategory.value / total) * 100)}% das saídas
          </small>
        </div>
      </div>

      <div className="dashboard-main">
        <div className="chart-panel">
          <div className="chart-title-row">
            <div>
              <h4>Onde o dinheiro foi</h4>
              <p>Distribuição dos gastos por categoria</p>
            </div>
            <span>{selectedLabel}</span>
          </div>
          <div
            className="chart-wrap"
            role="img"
            aria-label={"Gráfico de gastos por categoria em " + selectedLabel}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 24, bottom: 0, left: 0 }}
                barCategoryGap="36%"
              >
                <CartesianGrid
                  horizontal={false}
                  stroke="#E1E9E7"
                  strokeDasharray="2 6"
                />
                <XAxis
                  type="number"
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("pt-BR", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(Number(value))
                  }
                  tick={{ fill: "#7A9698", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={94}
                  tick={{ fill: "#31535A", fontSize: 12, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#EAF4F1" }}
                  formatter={(value) => [money(Number(value)), "Gasto"]}
                  contentStyle={{
                    borderRadius: 9,
                    border: "1px solid #DCE7E5",
                    boxShadow: "0 12px 28px rgba(16,55,66,.13)",
                    fontFamily: "IBM Plex Sans",
                  }}
                />
                <Bar
                  key={period}
                  dataKey="value"
                  radius={[0, 5, 5, 0]}
                  maxBarSize={26}
                  isAnimationActive={
                    hasInteracted &&
                    !window.matchMedia("(prefers-reduced-motion: reduce)")
                      .matches
                  }
                  animationDuration={760}
                  animationEasing="ease-out"
                >
                  {chartData.map((item) => (
                    <Cell
                      key={item.name}
                      fill={item.color}
                      opacity={
                        activeCategory && activeCategory !== item.name
                          ? 0.25
                          : 1
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-foot">
            <span className="chart-foot-pulse" />
            Selecione uma categoria ao lado para ver os lançamentos.
          </div>
        </div>

        <aside
          key={period}
          className="breakdown-panel"
          aria-label="Resumo por categoria"
        >
          <div className="breakdown-heading">
            <span>Composição</span>
            <strong>100%</strong>
          </div>
          <div className="breakdown-stack" aria-hidden="true">
            {chartData.map((item) => (
              <span
                key={item.name}
                style={{
                  width: (item.value / total) * 100 + "%",
                  backgroundColor: item.color,
                }}
              />
            ))}
          </div>
          <div className="breakdown-list">
            {chartData.map(({ name, value, color }) => (
              <button
                key={name}
                type="button"
                className={activeCategory === name ? "selected" : ""}
                onClick={() =>
                  setActiveCategory(activeCategory === name ? null : name)
                }
                aria-pressed={activeCategory === name}
              >
                <span className="breakdown-name">
                  <i style={{ backgroundColor: color }} />
                  {name}
                </span>
                <span className="breakdown-value">
                  {money(value)}
                  <small>{Math.round((value / total) * 100)}%</small>
                </span>
              </button>
            ))}
          </div>
          <div className="breakdown-note">
            <span aria-hidden="true">↗</span>
            <p>
              <strong>{topCategory.name}</strong> concentra a maior parte dos
              gastos neste período.
            </p>
          </div>
        </aside>
      </div>

      <div className="transaction-panel">
        <div className="transaction-heading">
          <div>
            <span className="transaction-kicker">Movimentações</span>
            <h4>
              {activeCategory
                ? "Lançamentos em " + activeCategory
                : "Por trás dos números"}
            </h4>
          </div>
          <span>
            {displayedTransactions.length} de{" "}
            {period === "quarter" ? "15" : "5"} exemplos
          </span>
        </div>
        <div
          key={period + (activeCategory || "all")}
          className="transaction-list"
        >
          {displayedTransactions.map((transaction, index) => (
            <div
              className="transaction"
              key={transaction.name + transaction.detail + index}
            >
              <span
                className="transaction-icon"
                style={
                  {
                    "--category-color": categories.find(
                      (category) => category.name === transaction.category,
                    )?.color,
                  } as CSSProperties
                }
              >
                {transaction.name.slice(0, 1)}
              </span>
              <span className="transaction-name">
                <strong>{transaction.name}</strong>
                <small>{transaction.detail}</small>
              </span>
              <span className="transaction-tag">{transaction.category}</span>
              <strong className="transaction-amount">
                − {money(transaction.amount)}
              </strong>
            </div>
          ))}
        </div>
      </div>
      <p className="demo-disclaimer">
        Prévia com dados ilustrativos. Nenhum extrato real é usado nesta
        demonstração.
      </p>
    </div>
  );
}

function AccessPage({ mode }: { mode: "login" | "register" }) {
  const title = mode === "login" ? "Entrar no Gerencia" : "Criar sua conta";
  return (
    <div className="access-page">
      <header className="access-header">
        <Logo light />
        <a href="/" className="access-back">
          Voltar ao início <ArrowIcon />
        </a>
      </header>
      <main className="access-card">
        <span className="access-symbol" aria-hidden="true">
          ✳
        </span>
        <h1>{title}</h1>
        <p>
          Estamos preparando esta área. Enquanto isso, explore a demonstração e
          conheça como o Gerencia vai organizar suas finanças.
        </p>
        <a href="/#demo" className="button button-primary">
          Explorar demonstração <ArrowIcon />
        </a>
      </main>
    </div>
  );
}

function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const path = window.location.pathname.replace(/\/$/, "");
  if (path === "/login" || path === "/register")
    return <AccessPage mode={path === "/login" ? "login" : "register"} />;

  return (
    <div className="site-shell">
      <div className="top-region">
        <header className="site-header container">
          <Logo light />
          <button
            className="menu-toggle"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
          <nav
            className={menuOpen ? "main-nav open" : "main-nav"}
            aria-label="Navegação principal"
          >
            <a href="#porque-usar" onClick={() => setMenuOpen(false)}>
              Por que usar
            </a>
            <a href="#como-funciona" onClick={() => setMenuOpen(false)}>
              Como funciona
            </a>
            <a href="#relatorios" onClick={() => setMenuOpen(false)}>
              Relatórios
            </a>
            <a href="#demo" onClick={() => setMenuOpen(false)}>
              Demonstração
            </a>
            <div className="mobile-auth">
              <a href="/login">Login</a>
              <a href="/register">Cadastro</a>
            </div>
          </nav>
          <div className="header-auth">
            <a href="/login">Login</a>
            <a className="header-signup" href="/register">
              Cadastro <ArrowIcon diagonal />
            </a>
          </div>
        </header>

        <main>
          <section className="hero container" aria-labelledby="hero-title">
            <div className="hero-copy">
              <div className="hero-signal">
                <span className="signal-lines" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>{" "}
                Inteligência para o seu dinheiro
              </div>
              <h1 id="hero-title">
                Seu extrato conta uma história.{" "}
                <span>Entenda cada capítulo.</span>
              </h1>
              <p>
                Transforme movimentações soltas em respostas claras sobre
                gastos, hábitos e o que vem pela frente.
              </p>
              <div className="hero-actions">
                <a className="button button-primary" href="#demo">
                  Ver demonstração <ArrowIcon />
                </a>
                <a className="text-link" href="#como-funciona">
                  Conhecer o projeto <ArrowIcon diagonal />
                </a>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-grid" />
              <div className="floating-note">
                <span className="note-ring">↗</span>
                <span>
                  <strong>Um detalhe que muda tudo</strong>
                  <small>Gastos recorrentes ficam visíveis.</small>
                </span>
              </div>
              <div className="statement-card">
                <div className="statement-top">
                  <span>Resumo do seu mês</span>
                  <span className="statement-dots">•••</span>
                </div>
                <div className="statement-total">
                  <small>Saídas identificadas</small>
                  <strong>
                    R$ 2.913<span>,00</span>
                  </strong>
                </div>
                <div className="statement-chart">
                  <span style={{ height: "38%" }} />
                  <span style={{ height: "52%" }} />
                  <span style={{ height: "43%" }} />
                  <span style={{ height: "69%" }} />
                  <span style={{ height: "59%" }} />
                  <span style={{ height: "78%" }} />
                  <span style={{ height: "64%" }} />
                  <span style={{ height: "93%" }} />
                  <span style={{ height: "74%" }} />
                  <span style={{ height: "85%" }} />
                  <span style={{ height: "68%" }} />
                  <span style={{ height: "100%" }} />
                </div>
                <div className="statement-bottom">
                  <span>Seus gastos organizados</span>
                  <strong>
                    5 categorias <ArrowIcon diagonal />
                  </strong>
                </div>
              </div>
              <div className="hero-corner-mark">
                g<span>.</span>
              </div>
            </div>
          </section>
        </main>
      </div>

      <section className="intro-strip" id="porque-usar">
        <div className="container intro-grid">
          <div className="intro-lead">
            <span className="section-kicker">A ideia</span>
            <h2>
              Menos adivinhação.
              <br />
              Mais direção.
            </h2>
          </div>
          <p>
            Um lugar para reunir seus lançamentos, entender padrões e chegar às
            perguntas que realmente importam: onde estou gastando, o que se
            repete e o que posso ajustar?
          </p>
          <div className="intro-mini">
            <span className="mini-asterisk">✳</span>
            <span>
              Feito para a vida real,
              <br />
              não para quem ama planilhas.
            </span>
          </div>
        </div>
      </section>

      <section
        className="value-section container"
        id="relatorios"
        aria-labelledby="value-heading"
      >
        <div className="section-heading">
          <div>
            <span className="section-kicker">Relatórios com contexto</span>
            <h2 id="value-heading">Números que levam a algum lugar.</h2>
          </div>
          <p>
            O Gerencia conecta cada movimentação a uma visão que ajuda você a
            agir.
          </p>
        </div>
        <div className="value-grid">
          <article className="value-item value-item-featured">
            <div className="value-item-top">
              <div className="value-icon icon-bars" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <span className="feature-index">01 / Olhar o todo</span>
            </div>
            <h3>Veja o padrão antes do detalhe.</h3>
            <p>
              Compare períodos e entenda quanto cada categoria ocupa no seu
              orçamento.
            </p>
            <div className="value-feature-visual" aria-hidden="true">
              <div className="feature-visual-label">
                <span>Exemplo de leitura</span>
                <strong>
                  42<span>%</span>
                </strong>
                <small>em alimentação</small>
              </div>
              <div className="feature-visual-bars">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <span className="feature-link">
              Visão por categoria <ArrowIcon diagonal />
            </span>
          </article>
          <article className="value-item value-item-recurring">
            <div className="value-icon icon-loop" aria-hidden="true">
              ↻
            </div>
            <div>
              <h3>O que se repete aparece.</h3>
              <p>
                Assinaturas e cobranças recorrentes deixam de passar
                despercebidas.
              </p>
              <span>
                Recorrências <ArrowIcon diagonal />
              </span>
            </div>
            <div className="mini-recurring" aria-hidden="true">
              <span>Todo mês</span>
              <strong>R$ 179,70</strong>
            </div>
          </article>
          <article className="value-item value-item-assistant">
            <div className="value-icon icon-chat" aria-hidden="true">
              <span>?</span>
            </div>
            <div>
              <h3>Pergunte do seu jeito.</h3>
              <p>
                Troque a linguagem das planilhas por respostas sobre os seus
                próprios dados.
              </p>
              <span>
                Assistente inteligente <ArrowIcon diagonal />
              </span>
            </div>
            <div className="mini-query" aria-hidden="true">
              Onde gastei mais?
            </div>
          </article>
        </div>
      </section>

      <section
        className="demo-section"
        id="demo"
        aria-labelledby="demo-heading"
      >
        <div className="container">
          <div className="demo-intro">
            <div>
              <span className="section-kicker">Experimente a análise</span>
              <h2 id="demo-heading">Um extrato. Várias descobertas.</h2>
            </div>
            <p>
              Troque o mês, compare três meses e selecione uma categoria. Esta é
              uma prévia de como seus dados podem ganhar contexto.
            </p>
          </div>
          <DemoDashboard />
        </div>
      </section>

      <section
        className="process-section container"
        id="como-funciona"
        aria-labelledby="process-heading"
      >
        <div className="process-heading">
          <span className="section-kicker">Do arquivo à clareza</span>
          <h2 id="process-heading">
            Simples de começar.
            <br />
            Útil todos os dias.
          </h2>
          <p>
            A proposta é tirar o trabalho manual do caminho e deixar a análise
            acessível.
          </p>
        </div>
        <div className="process-steps">
          <article>
            <span className="step-number">01</span>
            <div className="step-symbol">↥</div>
            <h3>Envie seus dados</h3>
            <p>
              Importe arquivos CSV ou XLSX. Você confirma as colunas quando
              necessário.
            </p>
          </article>
          <article>
            <span className="step-number">02</span>
            <div className="step-symbol">≡</div>
            <h3>Revise com confiança</h3>
            <p>
              Veja as categorias, corrija lançamentos e acompanhe a qualidade
              dos dados.
            </p>
          </article>
          <article>
            <span className="step-number">03</span>
            <div className="step-symbol">◎</div>
            <h3>Descubra padrões</h3>
            <p>
              Explore relatórios, recorrências e perguntas sobre o seu
              histórico.
            </p>
          </article>
        </div>
      </section>

      <section className="closing-section">
        <div className="container closing-inner">
          <div>
            <span className="section-kicker">
              Uma nova leitura das suas finanças
            </span>
            <h2>
              Mais clareza hoje.
              <br />
              Melhores escolhas amanhã.
            </h2>
          </div>
          <a className="button button-light" href="#demo">
            Explorar demonstração <ArrowIcon />
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <Logo />
          <p>
            Seus dados fazem mais sentido quando contam a história completa.
          </p>
          <span>© {new Date().getFullYear()} Gerencia</span>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
