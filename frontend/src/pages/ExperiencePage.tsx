import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Brand from "../components/Brand";
import CitedFigure from "../components/CitedFigure";
import GroundChart from "../components/GroundChart";
import Icon from "../components/Icon";
import ReadingsFigure from "../components/ReadingsFigure";
import SourceTable from "../components/SourceTable";
import { useAuth } from "../auth/AuthContext";
import useDemoExperience from "../hooks/useDemoExperience";
import { categories, demo, formatPercentage, money, monthKeys, monthlyDelta, monthRows, type DemoPreset } from "../components/dashboard/demoModel";

const ConnectedDashboard = lazy(() => import("../components/dashboard/ConnectedDashboard"));

const contents = [
  { href: "#problema", label: "Problema" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#demo", label: "Demonstração" },
  { href: "#perguntas", label: "Perguntas" },
];

// Every number on the page comes from the same fictitious data the figures use.
const quarterTotal = monthRows.reduce((sum, row) => sum + row.total, 0);
const entryCount = monthKeys.reduce((sum, key) => sum + demo[key].transactions.length, 0);
const august = monthlyDelta("ago")!;

const stats = [
  { icon: "calendar", label: "Faturas", value: String(monthKeys.length), text: `Meses fictícios, de junho a agosto de 2026, somando ${money(quarterTotal)} em saídas.` },
  { icon: "receipt", label: "Lançamentos", value: String(entryCount), text: "Compras com data, estabelecimento e categoria. Cada total é a soma exata delas." },
  { icon: "tags", label: "Categorias", value: String(categories.length), text: "Categorias com cor fixa, as mesmas em todas as figuras e na demonstração." },
] as const;

const BarsMark = ({ className }: { className: string }) => <svg className={className} viewBox="0 0 30 29" aria-hidden="true"><path d="M2 27h6l3-11H5L2 27Zm10 0h6l5-20h-6l-5 20Zm10 0h6l6-27h-6l-6 27Z" /></svg>;

export default function ExperiencePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { state, update } = useDemoExperience();
  const { status } = useAuth();
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    document.title = "gerenCIA — entenda o caminho do seu dinheiro";
  }, []);

  // A página inicial é só para visitantes: quem já está logado vai para o painel.
  useEffect(() => {
    if (status === "authenticated") window.location.replace("/app");
  }, [status]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // The header marks the section that crosses the middle of the screen.
  useEffect(() => {
    const sections = contents.map((item) => document.querySelector(item.href)).filter((node): node is Element => !!node);
    const observer = new IntersectionObserver((records) => {
      records.forEach((record) => { if (record.isIntersecting) setCurrent(`#${record.target.id}`); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const openPreset = (preset: DemoPreset) => update({ period: preset.period ?? "ago", category: preset.category ?? null, chart: preset.chart ?? "bar" }, preset.focus);
  const closeMenu = () => setMenuOpen(false);

  return <div className="experience-shell"><a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="site-header on-night" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) closeMenu(); }}>
      <div className="page-container header-inner">
        <Brand />
        <button ref={menuButton} className="menu-toggle" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen((value) => !value)}><span /><span /></button>
        <nav id="site-navigation" className={menuOpen ? "site-nav is-open" : "site-nav"} aria-label="Navegação principal">
          <ol>{contents.map((item) => <li key={item.href}><a href={item.href} onClick={closeMenu} aria-current={current === item.href ? "location" : undefined}>{item.label}</a></li>)}</ol>
          {/* Quem está logado já está a caminho do painel, então só visitantes veem estes links. */}
          <div className="nav-account" data-state={status}>
            {status !== "authenticated" && <><a className="nav-signin" href="/login">Entrar</a><a className="header-pill" href="/register">Cadastrar</a></>}
          </div>
        </nav>
      </div>
    </header>

    <main id="main-content" tabIndex={-1}>
      <section className="hero on-night" id="visao-geral" aria-labelledby="hero-title">
        <div className="page-container hero-inner">
          <div className="hero-copy">
            <h1 id="hero-title">Sua fatura diz mais que o total.</h1>
            <p className="lead">O gerenCIA está sendo construído para transformar faturas de cartão em CSV ou XLSX numa leitura por mês e por categoria, em que cada total leva aos lançamentos que o formam.</p>
            <div className="action-row"><a className="primary-button" href="#demo">Explorar a demonstração</a><a className="secondary-button" href="#como-funciona">Como funciona</a></div>
          </div>
          <div className="hero-stage">
            <div className="float-card is-left"><p>Saídas no trimestre</p><strong>{money(quarterTotal)}</strong><span>{entryCount} lançamentos</span></div>
            <div className="float-card is-right"><p>Agosto em relação a julho</p><strong>{money(august.amount).replace("-", "−")}</strong><span>{formatPercentage(Math.abs(august.percentage) / 100)} a menos</span></div>
            <CitedFigure number="1" onOpenPreset={openPreset} />
          </div>
        </div>
      </section>

      <section className="band has-glow" id="numeros" aria-labelledby="numbers-title">
        <GroundChart />
        <div className="page-container">
          <div className="section-head is-center">
            <h2 id="numbers-title" className="section-title">Uma demonstração que fecha a conta.</h2>
            <p className="section-intro">Os números abaixo vêm dos dados fictícios usados em todas as figuras. A importação de faturas está em desenvolvimento.</p>
          </div>
          <ul className="stat-cards">{stats.map((stat, index) => <li key={stat.label} className={index === 1 ? "is-featured" : undefined}>
            <span className="stat-label"><i><Icon name={stat.icon} size={18} /></i>{stat.label}</span>
            <strong>{stat.value}</strong>
            <p>{stat.text}</p>
          </li>)}</ul>
        </div>
      </section>

      <section className="band" id="problema" aria-labelledby="problema-title">
        <div className="band-sheet"><div className="page-container split">
          <div className="split-media"><SourceTable /></div>
          <div className="split-copy">
            <h2 id="problema-title" className="section-title">O total da fatura não explica o mês.</h2>
            <p className="section-intro">A fatura do cartão informa quanto pagar, mas não mostra para onde foi o dinheiro.</p>
            <ul className="feature-list">
              <li><span className="chip"><Icon name="rows" /></span><div><h3>Linhas sem contexto</h3><p>As compras chegam como dezenas de linhas com descrições abreviadas, sem categoria e sem comparação com os meses anteriores.</p></div></li>
              <li><span className="chip"><Icon name="columns" /></span><div><h3>Leitura organizada</h3><p>O gerenCIA foi projetado para ler essas linhas, identificar o estabelecimento, atribuir uma categoria e organizar os valores por período. A <a className="xref" href="#tabela-1">Tabela 1</a> mostra o mesmo lançamento antes e depois.</p></div></li>
            </ul>
          </div>
        </div></div>
      </section>

      <section className="band has-glow is-mirrored" id="como-funciona" aria-labelledby="workflow-title">
        <div className="page-container">
          <div className="section-head is-center">
            <h2 id="workflow-title" className="section-title">Do arquivo à leitura por categoria.</h2>
            <p className="section-intro">O percurso tem três etapas. As duas primeiras dependem da importação, que está em desenvolvimento; a terceira já funciona na demonstração, como mostra a <a className="xref" href="#figura-2">Figura 2</a>.</p>
          </div>
          <ol className="procedure">
            <li><span className="step-no">1</span><h3>Envie a fatura</h3><p>Arquivos CSV ou XLSX com data, descrição e valor de cada compra.</p><p className="status-line"><i className="status-mark" aria-hidden="true" />Em desenvolvimento</p></li>
            <li><span className="step-no">2</span><h3>Revise descrições e categorias</h3><p>Estabelecimentos padronizados e categorias que podem ser corrigidas e salvas como regra.</p><p className="status-line"><i className="status-mark" aria-hidden="true" />Em desenvolvimento</p></li>
            <li><span className="step-no">3</span><h3>Leia por período, categoria e lançamento</h3><p>Compare meses, veja a parte de cada categoria e chegue aos lançamentos de cada total.</p><p className="status-line"><i className="status-mark is-available" aria-hidden="true" />Disponível na demonstração</p></li>
          </ol>
          <ReadingsFigure onOpenPreset={openPreset} />
        </div>
      </section>

      <section className="band" id="demo" aria-labelledby="demo-title">
        <div className="band-night on-night"><div className="page-container">
          <div className="section-head is-split">
            <h2 id="demo-title" className="section-title">Explore a demonstração.</h2>
            <p className="section-intro">Escolha um período, alterne entre barras e rosca e selecione uma categoria para ver os lançamentos dela. A soma dos lançamentos confere com cada total, e o endereço da página guarda o recorte escolhido.</p>
          </div>
          <Suspense fallback={<div className="dashboard-loading" role="status">Preparando a demonstração…</div>}><ConnectedDashboard state={state} onChange={update} /></Suspense>
        </div></div>
      </section>

      <section className="band has-glow" id="perguntas" aria-labelledby="questions-title">
        <div className="page-container">
          <div className="section-head is-center">
            <h2 id="questions-title" className="section-title">Perguntas frequentes.</h2>
            <p className="section-intro">O que a demonstração mostra e o que ainda está em desenvolvimento.</p>
          </div>
          <div className="question-list">
            <details><summary>Os números são de uma conta real?</summary><p>Não. Períodos, totais e lançamentos são fictícios, criados para a demonstração. Ainda assim, cada total é a soma exata dos lançamentos do período, como numa fatura de verdade.</p></details>
            <details><summary>Posso importar minha fatura agora?</summary><p>Ainda não. A importação de CSV e XLSX está em desenvolvimento. Você já pode criar uma conta, e a demonstração funciona sem cadastro e sem enviar dados.</p></details>
            <details><summary>Como as figuras se conectam à demonstração?</summary><p>Cada recorte da Figura 2 abre o período, o gráfico ou a categoria correspondente na Figura 3. O endereço da página guarda o recorte, e ele pode ser compartilhado.</p></details>
          </div>
        </div>
      </section>

      <section className="closing" aria-labelledby="closing-title">
        <div className="closing-panel">
          <BarsMark className="closing-mark is-left" />
          <BarsMark className="closing-mark is-right" />
          <h2 id="closing-title">Veja de onde vem cada total.</h2>
          <p>A demonstração funciona sem cadastro e sem enviar dados.</p>
          <div className="action-row"><a className="primary-button is-night" href="#demo">Explorar a demonstração</a><a className="secondary-button" href="/register">Criar conta</a></div>
        </div>
      </section>
    </main>

    <footer className="site-footer on-night">
      <div className="page-container footer-grid">
        <div className="footer-brand"><Brand /><p>Organização financeira para o dia a dia. Projeto acadêmico em desenvolvimento.</p></div>
        <nav className="footer-links" aria-label="Rodapé">
          <div><h2>Seções</h2><ul>{contents.map((item) => <li key={item.href}><a href={item.href}>{item.label}</a></li>)}</ul></div>
          <div><h2>Páginas</h2><ul><li><a href="#visao-geral">Voltar ao início</a></li><li><a href="/register">Criar conta</a></li><li><a href="/login">Entrar</a></li></ul></div>
        </nav>
        <dl className="footer-facts">
          <div><dt>Dados</dt><dd>Fictícios, junho a agosto de 2026</dd></div>
          <div><dt>Em desenvolvimento</dt><dd>Importação de faturas</dd></div>
        </dl>
        <p className="footer-legal">© {new Date().getFullYear()} gerenCIA</p>
      </div>
      <div className="footer-wordmark" aria-hidden="true" />
    </footer>
  </div>;
}
