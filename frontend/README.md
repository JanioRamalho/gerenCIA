# Frontend do gerenCIA

Página pública para pessoas físicas, construída com React 19, TypeScript e Vite. A demonstração financeira usa dados **fictícios** de junho a agosto de 2026. Os lançamentos exibidos são exemplos e não formam um extrato completo.

## Executar

```bash
cd frontend
npm install
npm run dev
npm run build
```

A página inicial está em `/`. A rota `/register` apresenta o formulário de cadastro com validação local. Nenhuma informação é enviada, pois a API de autenticação ainda não está implementada. A rota `/login` informa que o acesso está em desenvolvimento.

## Estrutura atual

- `src/pages/ExperiencePage.tsx`: página completa e navegação.
- `src/pages/RegistrationPage.tsx` e `src/styles/registration.css`: prévia do cadastro com validação local.
- `src/components/HeroStory.tsx`: mensagem principal e entrada para a demonstração.
- `src/components/HeroMascotExperience.tsx`: interação com arquivos fictícios, mastigação e insight ilustrativo.
- `src/components/MascotCalculator.tsx`: mascote vetorial animável.
- `src/components/InsightCarousel.tsx`: análises ligadas aos mesmos dados da demonstração.
- `src/components/dashboard/demoData.ts`: registros fictícios originais.
- `src/components/dashboard/demoModel.ts`: totais, percentuais, variações e textos derivados em um só lugar.
- `src/components/dashboard/ConnectedDashboard.tsx`: gráficos Recharts por categoria, filtros e lançamentos.
- `src/hooks/useDemoExperience.ts`: estado do período, categoria e gráfico refletido na URL.
- `src/styles/tokens.css`, `experience.css`, `experience-responsive.css`, `premium.css`, `data-visuals.css` e `hero-mascot.css`: identidade, superfícies analíticas e responsividade em uso.

A abertura usa dois cartões de arquivo cenográficos. Eles podem ser arrastados até o mascote ou acionados por clique, toque e teclado; nenhum arquivo real é enviado ou analisado. O resultado usa os mesmos dados fictícios da dashboard. A animação respeita a preferência por movimento reduzido. A dashboard é carregada em módulo separado, e o carrossel de descobertas é manual.

## Estado compartilhável

Os parâmetros `period`, `category` e `chart` na URL guardam o recorte escolhido. Por exemplo: `/?period=ago&category=Alimentação&chart=bar#demo-categories`. Links das descobertas abrem a demonstração no contexto correspondente, e recarregar mantém a seleção. A preferência de ordenação pode ser salva em `localStorage`; se o armazenamento estiver bloqueado, a página continua funcionando.

## Verificação

Com o servidor local aberto em `http://127.0.0.1:5173` (ou com `GERENCIA_TEST_URL` apontando para outra porta):

```bash
python scripts/frontend/check_front_experience.py
python scripts/frontend/check_front_experience_a11y.py
python scripts/frontend/check_carousel.py
python scripts/frontend/check_dashboard.py
```

Os scripts usam Playwright e axe para conferir mascote, arrasto, carrossel, links, filtros, URL, visual da abertura, armazenamento bloqueado, acessibilidade básica e larguras de 320, 390, 768 e 1440 px. Capturas ficam em `.impeccable/review/` na raiz do repositório.

## Integração futura

A interface consumirá a API quando autenticação e importação forem disponibilizadas. Cálculos financeiros e autorização dos dados reais pertencem ao backend.