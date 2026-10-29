import { lazy, Suspense } from "react";
import BarsMark from "../components/BarsMark";
import CitedFigure from "../components/CitedFigure";
import GroundChart from "../components/GroundChart";
import Icon from "../components/Icon";
import ReadingsFigure from "../components/ReadingsFigure";
import SourceTable from "../components/SourceTable";
import SiteFooter from "../components/site/SiteFooter";
import SiteHeader from "../components/site/SiteHeader";
import useRedirectSignedInUser from "../auth/useRedirectSignedInUser";
import useDemoExperience from "../hooks/useDemoExperience";
import usePageTitle from "../hooks/usePageTitle";
import {
  categories, demo, formatMoneyDifference, formatPercentage, money, monthKeys, monthlyDelta, monthRows,
  type DemoPreset, type DemoState,
} from "../components/dashboard/demoModel";

// lazy carrega a demonstração (e o Recharts, que é grande) só depois do resto
// da página, para a primeira tela abrir mais rápido.
const ConnectedDashboard = lazy(() => import("../components/dashboard/ConnectedDashboard"));

// Todos os números da página vêm dos mesmos dados fictícios das figuras.
const quarterTotal = monthRows.reduce((sum, row) => sum + row.total, 0);
const entryCount = monthKeys.reduce((sum, key) => sum + demo[key].transactions.length, 0);
const august = monthlyDelta("ago")!;

const stats = [
  { icon: "calendar", label: "Faturas", value: String(monthKeys.length), text: `Meses fictícios, de junho a agosto de 2026, somando ${money(quarterTotal)} em saídas.` },
  { icon: "receipt", label: "Lançamentos", value: String(entryCount), text: "Compras com data, estabelecimento e categoria. Cada total é a soma exata delas." },
  { icon: "tags", label: "Categorias", value: String(categories.length), text: "Categorias com cor fixa, as mesmas em todas as figuras e na demonstração." },
] as const;

const workflowSteps = [
  { title: "Envie a fatura", text: "Arquivos CSV ou XLSX com data, descrição e valor de cada compra.", available: false },
  { title: "Revise descrições e categorias", text: "Estabelecimentos padronizados e categorias que podem ser corrigidas e salvas como regra.", available: false },
  { title: "Leia por período, categoria e lançamento", text: "Compare meses, veja a parte de cada categoria e chegue aos lançamentos de cada total.", available: true },
];

const questions = [
  {
    question: "Os números são de uma conta real?",
    answer: "Não. Períodos, totais e lançamentos são fictícios, criados para a demonstração. Ainda assim, cada total é a soma exata dos lançamentos do período, como numa fatura de verdade.",
  },
  {
    question: "Posso importar minha fatura agora?",
    answer: "Ainda não. A importação de CSV e XLSX está em desenvolvimento. Você já pode criar uma conta, e a demonstração funciona sem cadastro e sem enviar dados.",
  },
  {
    question: "Como as figuras se conectam à demonstração?",
    answer: "Cada recorte da Figura 2 abre o período, o gráfico ou a categoria correspondente na Figura 3. O endereço da página guarda o recorte, e ele pode ser compartilhado.",
  },
];

type OpenPreset = (preset: DemoPreset) => void;

/**
 * Página inicial, para visitantes: apresenta o gerenCIA com figuras feitas de
 * dados fictícios e termina na demonstração interativa.
 */
export default function ExperiencePage() {
  const { state, update } = useDemoExperience();
  usePageTitle("gerenCIA — entenda o caminho do seu dinheiro");
  // A página inicial é só para visitantes: quem já está logado vai para o painel.
  useRedirectSignedInUser();

  // Os links das figuras abrem um recorte da demonstração. O que o recorte não
  // define volta ao padrão: agosto, todas as categorias e gráfico de barras.
  function openPreset(preset: DemoPreset) {
    update({ period: preset.period ?? "ago", category: preset.category ?? null, chart: preset.chart ?? "bar" }, preset.focus);
  }

  return <div className="experience-shell"><a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <SiteHeader />
    <main id="main-content" tabIndex={-1}>
      <HeroSection onOpenPreset={openPreset} />
      <NumbersSection />
      <ProblemSection />
      <WorkflowSection onOpenPreset={openPreset} />
      <DemoSection state={state} onChange={update} />
      <QuestionsSection />
      <ClosingSection />
    </main>
    <SiteFooter />
  </div>;
}

/** Abertura: a promessa do produto, os dois cartões de números e a Figura 1. */
function HeroSection({ onOpenPreset }: { onOpenPreset: OpenPreset }) {
  return <section className="hero on-night" id="visao-geral" aria-labelledby="hero-title">
    <div className="page-container hero-inner">
      <div className="hero-copy">
        <h1 id="hero-title">Sua fatura diz mais que o total.</h1>
        <p className="lead">O gerenCIA está sendo construído para transformar faturas de cartão em CSV ou XLSX numa leitura por mês e por categoria, em que cada total leva aos lançamentos que o formam.</p>
        <div className="action-row">
          <a className="primary-button" href="#demo">Explorar a demonstração</a>
          <a className="secondary-button" href="#como-funciona">Como funciona</a>
        </div>
      </div>
      <div className="hero-stage">
        {/* Os dois cartões flutuam ao lado da Figura 1. */}
        <div className="float-card is-left">
          <p>Saídas no trimestre</p>
          <strong>{money(quarterTotal)}</strong>
          <span>{entryCount} lançamentos</span>
        </div>
        <div className="float-card is-right">
          <p>Agosto em relação a julho</p>
          <strong>{formatMoneyDifference(august.amount)}</strong>
          <span>{formatPercentage(Math.abs(august.change))} a menos</span>
        </div>
        <CitedFigure number="1" onOpenPreset={onOpenPreset} />
      </div>
    </div>
  </section>;
}

/** Os três números da demonstração: faturas, lançamentos e categorias. */
function NumbersSection() {
  return <section className="band has-glow" id="numeros" aria-labelledby="numbers-title">
    <GroundChart />
    <div className="page-container">
      <div className="section-head is-center">
        <h2 id="numbers-title" className="section-title">Uma demonstração que fecha a conta.</h2>
        <p className="section-intro">Os números abaixo vêm dos dados fictícios usados em todas as figuras. A importação de faturas está em desenvolvimento.</p>
      </div>
      <ul className="stat-cards">
        {stats.map((stat, index) => <li key={stat.label} className={index === 1 ? "is-featured" : undefined}>
          <span className="stat-label"><i><Icon name={stat.icon} size={18} /></i>{stat.label}</span>
          <strong>{stat.value}</strong>
          <p>{stat.text}</p>
        </li>)}
      </ul>
    </div>
  </section>;
}

/** O problema: a fatura informa quanto pagar, mas não para onde foi o dinheiro. */
function ProblemSection() {
  return <section className="band" id="problema" aria-labelledby="problema-title">
    <div className="band-sheet"><div className="page-container split">
      <div className="split-media"><SourceTable /></div>
      <div className="split-copy">
        <h2 id="problema-title" className="section-title">O total da fatura não explica o mês.</h2>
        <p className="section-intro">A fatura do cartão informa quanto pagar, mas não mostra para onde foi o dinheiro.</p>
        <ul className="feature-list">
          <li>
            <span className="chip"><Icon name="rows" /></span>
            <div><h3>Linhas sem contexto</h3><p>As compras chegam como dezenas de linhas com descrições abreviadas, sem categoria e sem comparação com os meses anteriores.</p></div>
          </li>
          <li>
            <span className="chip"><Icon name="columns" /></span>
            <div><h3>Leitura organizada</h3><p>O gerenCIA foi projetado para ler essas linhas, identificar o estabelecimento, atribuir uma categoria e organizar os valores por período. A <a className="xref" href="#tabela-1">Tabela 1</a> mostra o mesmo lançamento antes e depois.</p></div>
          </li>
        </ul>
      </div>
    </div></div>
  </section>;
}

/** Como funciona: as três etapas, cada uma com a sua situação, e a Figura 2. */
function WorkflowSection({ onOpenPreset }: { onOpenPreset: OpenPreset }) {
  return <section className="band has-glow is-mirrored" id="como-funciona" aria-labelledby="workflow-title">
    <div className="page-container">
      <div className="section-head is-center">
        <h2 id="workflow-title" className="section-title">Do arquivo à leitura por categoria.</h2>
        <p className="section-intro">O percurso tem três etapas. As duas primeiras dependem da importação, que está em desenvolvimento; a terceira já funciona na demonstração, como mostra a <a className="xref" href="#figura-2">Figura 2</a>.</p>
      </div>
      <ol className="procedure">
        {workflowSteps.map((step, index) => <li key={step.title}>
          <span className="step-no">{index + 1}</span>
          <h3>{step.title}</h3>
          <p>{step.text}</p>
          {step.available
            ? <p className="status-line"><i className="status-mark is-available" aria-hidden="true" />Disponível na demonstração</p>
            : <p className="status-line"><i className="status-mark" aria-hidden="true" />Em desenvolvimento</p>}
        </li>)}
      </ol>
      <ReadingsFigure onOpenPreset={onOpenPreset} />
    </div>
  </section>;
}

/** A demonstração interativa (Figura 3), carregada depois do resto da página. */
function DemoSection({ state, onChange }: { state: DemoState; onChange: (patch: Partial<DemoState>) => void }) {
  return <section className="band" id="demo" aria-labelledby="demo-title">
    <div className="band-night on-night"><div className="page-container">
      <div className="section-head is-split">
        <h2 id="demo-title" className="section-title">Explore a demonstração.</h2>
        <p className="section-intro">Escolha um período, alterne entre barras e rosca e selecione uma categoria para ver os lançamentos dela. A soma dos lançamentos confere com cada total, e o endereço da página guarda o recorte escolhido.</p>
      </div>
      {/* Suspense mostra o aviso enquanto o código da demonstração chega. */}
      <Suspense fallback={<div className="dashboard-loading" role="status">Preparando a demonstração…</div>}>
        <ConnectedDashboard state={state} onChange={onChange} />
      </Suspense>
    </div></div>
  </section>;
}

/** Perguntas frequentes, que abrem e fecham sem JavaScript (details e summary). */
function QuestionsSection() {
  return <section className="band has-glow" id="perguntas" aria-labelledby="questions-title">
    <div className="page-container">
      <div className="section-head is-center">
        <h2 id="questions-title" className="section-title">Perguntas frequentes.</h2>
        <p className="section-intro">O que a demonstração mostra e o que ainda está em desenvolvimento.</p>
      </div>
      <div className="question-list">
        {questions.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
      </div>
    </div>
  </section>;
}

/** Fechamento: o convite final, com o símbolo das barras dos dois lados. */
function ClosingSection() {
  return <section className="closing" aria-labelledby="closing-title">
    <div className="closing-panel">
      <BarsMark className="closing-mark is-left" />
      <BarsMark className="closing-mark is-right" />
      <h2 id="closing-title">Veja de onde vem cada total.</h2>
      <p>A demonstração funciona sem cadastro e sem enviar dados.</p>
      <div className="action-row">
        <a className="primary-button is-night" href="#demo">Explorar a demonstração</a>
        <a className="secondary-button" href="/register">Criar conta</a>
      </div>
    </div>
  </section>;
}
