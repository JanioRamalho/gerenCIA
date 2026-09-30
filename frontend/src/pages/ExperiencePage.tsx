import { lazy, Suspense, useEffect, useRef, useState } from "react";
import HeroStory from "../components/HeroStory";
import RegistrationPage from "./RegistrationPage";
import UiArrow from "../components/UiArrow";
import SampleReport from "../components/SampleReport";
import InsightCarousel from "../components/InsightCarousel";
import useDemoExperience from "../hooks/useDemoExperience";
import type { DemoPreset } from "../components/dashboard/demoModel";

const ConnectedDashboard = lazy(() => import("../components/dashboard/ConnectedDashboard"));

function Logo() {
  return <a className="brand" href="/" aria-label="gerenCIA, início" translate="no"><svg viewBox="0 0 30 29" fill="none" aria-hidden="true"><path d="M2 27h6l3-11H5L2 27Zm10 0h6l5-20h-6l-5 20Zm10 0h6l6-27h-6l-6 27Z" fill="currentColor" /></svg><span>geren<span>CIA</span><i>.</i></span></a>;
}

function AccessPage() {
  return <div className="access-shell"><a className="skip-link" href="#main-content">Pular para o conteúdo</a><header className="access-header page-container"><Logo /><a href="/" className="access-back">Voltar ao início <UiArrow /></a></header><main className="access-main page-container" id="main-content" tabIndex={-1}><div className="access-copy"><p>Acesso em desenvolvimento</p><h1>Comece pela leitura dos dados de exemplo.</h1><p>As contas pessoais ainda não estão disponíveis. Explore meses, categorias e lançamentos fictícios sem cadastro e sem enviar informações pessoais.</p><a className="primary-button" href="/#demo">Explorar demonstração <UiArrow direction="diagonal" /></a></div><SampleReport /></main></div>;
}

export default function ExperiencePage() {
  const path = window.location.pathname.replace(/\/$/, "");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const { state, update } = useDemoExperience();

  useEffect(() => {
    document.title = path === "/login" ? "Entrar | gerenCIA" : path === "/register" ? "Cadastro | gerenCIA" : "gerenCIA — entenda o caminho do seu dinheiro";
  }, [path]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) { setMenuOpen(false); menuButton.current?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  if (path === "/register") return <RegistrationPage />;
  if (path === "/login") return <AccessPage />;

  const openPreset = (preset: DemoPreset) => update({ period: preset.period ?? "ago", category: preset.category ?? null, chart: preset.chart ?? "bar" }, preset.focus);

  return <div className="experience-shell"><a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <header className="site-header" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setMenuOpen(false); }}><div className="page-container header-inner"><Logo /><button ref={menuButton} className="menu-toggle" type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen((value) => !value)}><span /><span /><span /></button><nav id="site-navigation" className={menuOpen ? "site-nav is-open" : "site-nav"} aria-label="Navegação principal"><a href="#visao-geral" onClick={() => setMenuOpen(false)}>Visão geral</a><a href="#como-funciona" onClick={() => setMenuOpen(false)}>Como funciona</a><a href="#relatorios" onClick={() => setMenuOpen(false)}>Relatórios</a><a href="#demo" onClick={() => setMenuOpen(false)}>Demonstração</a><a href="/login" className="mobile-login">Entrar</a><a href="/register" className="mobile-signup">Cadastrar</a></nav><div className="header-account"><a className="login-link" href="/login">Entrar</a><a className="signup-link" href="/register">Cadastrar <UiArrow direction="diagonal" /></a></div></div></header>
    <main id="main-content" tabIndex={-1}>
      <HeroStory onOpenPreset={openPreset} />

      <section className="workflow-section" id="como-funciona" aria-labelledby="workflow-title"><div className="page-container workflow-grid"><div className="workflow-lead"><h2 id="workflow-title">Do arquivo à decisão.</h2><p>O gerenCIA está sendo construído para transformar faturas em uma leitura organizada. Enquanto a importação não chega, você pode explorar o resultado com dados fictícios.</p><a href="#demo" className="text-link">Conhecer a demonstração <UiArrow /></a></div><ol className="workflow-steps"><li><span>01</span><div><h3>Reúna os lançamentos</h3><p>O fluxo planejado começa com faturas CSV ou XLSX em um só lugar.</p></div></li><li><span>02</span><div><h3>Confira o contexto</h3><p>Descrições e categorias revisadas tornam a análise mais confiável.</p></div></li><li><span>03</span><div><h3>Leia por perspectivas</h3><p>Compare meses, encontre prioridades e examine exemplos de movimentações.</p></div></li></ol></div><div className="page-container workflow-note"><span>Disponível agora</span><p>Demonstração com dados fictícios. Importação e contas pessoais estão em desenvolvimento.</p></div></section>

      <section className="insights-section" id="relatorios" aria-labelledby="insights-title"><div className="page-container"><div className="section-heading"><h2 id="insights-title">Uma fatura. Três perguntas.</h2><p>Compare os meses, localize a maior categoria e chegue aos lançamentos de exemplo.</p></div><InsightCarousel onOpenPreset={openPreset} /></div></section>

      <section className="demo-section" id="demo" aria-labelledby="demo-title"><div className="page-container"><div className="section-heading"><h2 id="demo-title">Abra os números.</h2><p>Escolha um período, alterne as categorias e veja os lançamentos que dão contexto aos valores.</p></div><Suspense fallback={<div className="dashboard-loading" role="status">Preparando a demonstração…</div>}><ConnectedDashboard state={state} onChange={update} /></Suspense></div></section>

      <section className="questions-section" aria-labelledby="questions-title"><div className="page-container questions-grid"><div><h2 id="questions-title">Antes de começar.</h2><p>O que você precisa saber sobre esta demonstração.</p></div><div className="question-list"><details><summary>Os números são de uma conta real?</summary><p>Não. Os períodos, totais e lançamentos são fictícios. Os lançamentos exibidos são apenas alguns exemplos, por isso não somam todos os valores das categorias.</p></details><details><summary>Posso importar minha fatura agora?</summary><p>A importação de CSV e XLSX está em desenvolvimento. A página permite explorar uma análise demonstrativa sem enviar dados pessoais.</p></details><details><summary>Como as descobertas se conectam aos gráficos?</summary><p>Cada descoberta abre o período, o gráfico ou a categoria correspondente na demonstração. Você pode alterar os filtros e compartilhar o endereço do recorte escolhido.</p></details></div></div></section>

      <section className="closing-section" aria-labelledby="closing-title"><div className="page-container closing-inner"><div><h2 id="closing-title">Um bom próximo passo começa com uma leitura clara.</h2><p>Explore o cenário fictício e encontre a pergunta que vale fazer aos seus próprios dados.</p></div><a className="primary-button" href="#demo">Explorar os dados <UiArrow direction="diagonal" /></a></div></section>
    </main><footer className="site-footer"><div className="page-container footer-inner"><Logo /><p>Organização financeira para o dia a dia.</p><div><a href="#visao-geral">Voltar ao início <UiArrow direction="up" /></a><span>© {new Date().getFullYear()} gerenCIA</span></div></div></footer>
  </div>;
}
