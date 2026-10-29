import Brand from "../Brand";
import { sectionLinks } from "./sectionLinks";

/** Rodapé da página inicial: as seções, as páginas de conta e de onde vêm os dados. */
export default function SiteFooter() {
  return <footer className="site-footer on-night">
    <div className="page-container footer-grid">
      <div className="footer-brand"><Brand /><p>Organização financeira para o dia a dia. Projeto acadêmico em desenvolvimento.</p></div>
      <nav className="footer-links" aria-label="Rodapé">
        <div>
          <h2>Seções</h2>
          <ul>{sectionLinks.map((item) => <li key={item.href}><a href={item.href}>{item.label}</a></li>)}</ul>
        </div>
        <div>
          <h2>Páginas</h2>
          <ul>
            <li><a href="#visao-geral">Voltar ao início</a></li>
            <li><a href="/register">Criar conta</a></li>
            <li><a href="/login">Entrar</a></li>
          </ul>
        </div>
      </nav>
      <dl className="footer-facts">
        <div><dt>Dados</dt><dd>Fictícios, junho a agosto de 2026</dd></div>
        <div><dt>Em desenvolvimento</dt><dd>Importação de faturas</dd></div>
      </dl>
      <p className="footer-legal">© {new Date().getFullYear()} gerenCIA</p>
    </div>
    {/* O nome gigante na borda de baixo é desenhado pelo CSS. */}
    <div className="footer-wordmark" aria-hidden="true" />
  </footer>;
}
