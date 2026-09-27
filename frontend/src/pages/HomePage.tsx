import { useEffect, useRef, useState } from "react";
import DemoCarousel from "../components/carousel/DemoCarousel";
import DemoDashboard from "../components/dashboard/DemoDashboard";

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

function AccessPage({ mode }: { mode: "login" | "register" }) {
  const title = mode === "login" ? "Entrar no Gerencia" : "Criar sua conta";
  return (
    <div className="access-page">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <header className="access-header">
        <Logo light />
        <a href="/" className="access-back">
          Voltar ao início <ArrowIcon />
        </a>
      </header>
      <main className="access-card" id="main-content" tabIndex={-1}>
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
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 1001px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [menuOpen]);
  const path = window.location.pathname.replace(/\/$/, "");
  useEffect(() => {
    document.title =
      path === "/login"
        ? "Entrar no Gerencia"
        : path === "/register"
          ? "Criar sua conta | Gerencia"
          : "Gerencia — clareza para decidir melhor";
  }, [path]);
  if (path === "/login" || path === "/register")
    return <AccessPage mode={path === "/login" ? "login" : "register"} />;

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <div className="top-region">
        <header
          className="site-header container"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setMenuOpen(false);
          }}
        >
          <Logo light />
          <button
            className="menu-toggle"
            ref={menuToggleRef}
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
          >
            <span />
            <span />
            <span />
          </button>
          <nav
            id="primary-navigation"
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
      </div>
      <main id="main-content" tabIndex={-1}>
        <div className="top-region hero-region">
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
        </div>

        <section
          className="intro-strip"
          id="porque-usar"
          aria-labelledby="intro-heading"
        >
          <div className="container intro-grid">
            <div className="intro-lead">
              <span className="section-kicker">A ideia</span>
              <h2 id="intro-heading">
                Menos adivinhação.
                <br />
                Mais direção.
              </h2>
            </div>
            <p>
              Um lugar para reunir seus lançamentos, entender padrões e chegar
              às perguntas que realmente importam: onde estou gastando, o que se
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
          <DemoCarousel />
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
                Troque o mês, compare três meses e selecione uma categoria. Esta
                é uma prévia de como seus dados podem ganhar contexto.
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
              <div className="step-symbol" aria-hidden="true">
                ↥
              </div>
              <h3>Envie seus dados</h3>
              <p>
                Importe arquivos CSV ou XLSX. Você confirma as colunas quando
                necessário.
              </p>
            </article>
            <article>
              <span className="step-number">02</span>
              <div className="step-symbol" aria-hidden="true">
                ≡
              </div>
              <h3>Revise com confiança</h3>
              <p>
                Veja as categorias, corrija lançamentos e acompanhe a qualidade
                dos dados.
              </p>
            </article>
            <article>
              <span className="step-number">03</span>
              <div className="step-symbol" aria-hidden="true">
                ◎
              </div>
              <h3>Descubra padrões</h3>
              <p>
                Explore relatórios, recorrências e perguntas sobre o seu
                histórico.
              </p>
            </article>
          </div>
        </section>

        <section className="closing-section" aria-labelledby="closing-heading">
          <div className="container closing-inner">
            <div>
              <span className="section-kicker">
                Uma nova leitura das suas finanças
              </span>
              <h2 id="closing-heading">
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
      </main>
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
