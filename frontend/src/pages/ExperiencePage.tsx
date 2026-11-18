import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Brand from "../components/Brand";
import CitedFigure from "../components/CitedFigure";
import ReadingsFigure from "../components/ReadingsFigure";
import SourceTable from "../components/SourceTable";
import { useAuth } from "../auth/AuthContext";
import useDemoExperience from "../hooks/useDemoExperience";
import { categories, demo, money, monthKeys, monthRows, type DemoPreset } from "../components/dashboard/demoModel";

const ConnectedDashboard = lazy(() => import("../components/dashboard/ConnectedDashboard"));

const contents = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#demo", label: "Demonstração" },
  { href: "#perguntas", label: "Perguntas" },
];

// Every number on the page comes from the same fictitious data the figures use.
const quarterTotal = monthRows.reduce((sum, row) => sum + row.total, 0);
const entryCount = monthKeys.reduce((sum, key) => sum + demo[key].transactions.length, 0);

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
    <header className="site-header" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) closeMenu(); }}>
      <div className="page-container header-inner">
        <Brand />
        <button ref={menuButton} className="menu-toggle" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen((value) => !value)}><span /><span /></button>
        <nav id="site-navigation" className={menuOpen ? "site-nav is-open" : "site-nav"} aria-label="Navegação principal">
          <ol>{contents.map((item) => <li key={item.href}><a href={item.href} onClick={closeMenu} aria-current={current === item.href ? "location" : undefined}>{item.label}</a></li>)}</ol>
          {/* Quem está logado já está a caminho do painel, então só visitantes veem estes links. */}
          <div className="nav-account" data-state={status}>
            {status !== "authenticated" && <><a className="nav-signin" href="/login">Entrar</a><a className="header-pill" href="/register">Criar conta</a></>}
          </div>
        </nav>
      </div>
    </header>

    <main id="main-content" tabIndex={-1}>
      <section className="hero" id="visao-geral" aria-labelledby="hero-title">
        <div className="page-container hero-inner">
          <div className="hero-copy">
            <h1 id="hero-title">Entenda para onde seu dinheiro vai.</h1>
            <p className="lead">Organize extratos e faturas em CSV ou XLSX. Compare meses, explore categorias e confira os lançamentos de cada total.</p>
            <div className="action-row"><a className="primary-button is-night" href="#demo">Explorar demonstração</a><a className="text-link" href="/register">Criar minha conta</a></div>
            <p className="hero-note">Conheça o gerenCIA com dados fictícios, sem cadastro.</p>
          </div>
          <div className="hero-stage">
            <CitedFigure number="1" onOpenPreset={openPreset} />
          </div>
        </div>
      </section>

      <section className="workflow-band" id="como-funciona" aria-labelledby="workflow-title">
        <div className="page-container">
          <h2 id="workflow-title" className="workflow-title">Do arquivo à análise, em três etapas.</h2>
          <ol className="procedure">
            <li><span className="step-no" aria-hidden="true">1</span><div><h3>Envie seu arquivo</h3><p>Importe um extrato ou uma fatura em CSV ou XLSX.</p></div></li>
            <li><span className="step-no" aria-hidden="true">2</span><div><h3>Confira os dados</h3><p>Verifique a qualidade do arquivo e revise as categorias dos lançamentos importados.</p></div></li>
            <li><span className="step-no" aria-hidden="true">3</span><div><h3>Explore seus gastos</h3><p>Compare períodos, confira categorias e acompanhe seus orçamentos.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="band" id="problema" aria-labelledby="problema-title">
        <div className="page-container split">
          <div className="split-copy">
            <h2 id="problema-title" className="section-title">Cada total tem uma origem.</h2>
            <p className="section-intro">Saia das descrições abreviadas para uma leitura por estabelecimento, categoria e período. A tabela mostra as mesmas compras no arquivo e na leitura organizada.</p>
          </div>
          <div className="split-media"><SourceTable /></div>
        </div>
      </section>

      <section className="band readings-band" aria-labelledby="readings-title">
        <div className="page-container">
          <div className="section-head">
            <h2 id="readings-title" className="section-title">O mesmo dinheiro, três leituras.</h2>
            <p className="section-intro">Veja a evolução dos meses, a composição por categoria e os lançamentos que formam cada valor. Cada recorte abre a demonstração correspondente.</p>
          </div>
          <ReadingsFigure onOpenPreset={openPreset} />
        </div>
      </section>

      <section className="band demo-band" id="demo" aria-labelledby="demo-title">
        <div className="page-container">
          <div className="section-head">
            <h2 id="demo-title" className="section-title">Explore a demonstração.</h2>
            <p className="section-intro">Escolha um período, alterne entre barras e rosca e selecione uma categoria para ver seus lançamentos. O endereço da página guarda o recorte para compartilhar.</p>
          </div>
          <p className="demo-provenance">Dados fictícios de junho a agosto de 2026: {monthKeys.length} meses, {entryCount} lançamentos e {categories.length} categorias, somando {money(quarterTotal)}. Cada total é a soma exata dos lançamentos.</p>
          <Suspense fallback={<div className="dashboard-loading" role="status">Preparando a demonstração…</div>}><ConnectedDashboard state={state} onChange={update} /></Suspense>
        </div>
      </section>

      <section className="band" id="perguntas" aria-labelledby="questions-title">
        <div className="page-container questions-layout">
          <div className="section-head">
            <h2 id="questions-title" className="section-title">Perguntas frequentes.</h2>
          </div>
          <div className="question-list">
            <details><summary>Os números são de uma conta real?</summary><p>Não. Períodos, totais e lançamentos são fictícios, criados para a demonstração. Ainda assim, cada total é a soma exata dos lançamentos do período, como numa fatura de verdade.</p></details>
            <details><summary>Posso importar minha fatura agora?</summary><p>Sim. Crie uma conta para importar arquivos CSV ou XLSX, conferir a qualidade e revisar seus lançamentos. Para conhecer primeiro, a demonstração funciona sem cadastro e sem enviar dados.</p></details>
            <details><summary>Como as figuras se conectam à demonstração?</summary><p>Cada recorte da Figura 2 abre o período, o gráfico ou a categoria correspondente na Figura 3. O endereço da página guarda o recorte, e ele pode ser compartilhado.</p></details>
          </div>
        </div>
      </section>

      <section className="closing" aria-labelledby="closing-title">
        <div className="page-container closing-panel">
          <h2 id="closing-title">Veja de onde vem cada total.</h2>
          <p>A demonstração funciona sem cadastro e sem enviar dados.</p>
          <div className="action-row"><a className="primary-button is-night" href="/register">Criar minha conta</a><a className="text-link" href="#demo">Explorar demonstração</a></div>
        </div>
      </section>
    </main>

    <footer className="site-footer">
      <div className="page-container footer-grid">
        <div className="footer-brand"><Brand /><p>Organização financeira para o dia a dia. Projeto acadêmico em desenvolvimento.</p></div>
        <nav className="footer-links" aria-label="Rodapé">
          <div><h2>Seções</h2><ul>{contents.map((item) => <li key={item.href}><a href={item.href}>{item.label}</a></li>)}</ul></div>
          <div><h2>Páginas</h2><ul><li><a href="#visao-geral">Voltar ao início</a></li><li><a href="/register">Criar conta</a></li><li><a href="/login">Entrar</a></li></ul></div>
        </nav>
        <dl className="footer-facts">
          <div><dt>Dados</dt><dd>Fictícios, junho a agosto de 2026</dd></div>
          <div><dt>Arquivos aceitos</dt><dd>CSV e XLSX</dd></div>
        </dl>
        <p className="footer-legal">© {new Date().getFullYear()} gerenCIA</p>
      </div>
    </footer>
  </div>;
}
