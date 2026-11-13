# Frontend do gerenCIA

Página pública para pessoas físicas, construída com React 19, TypeScript e Vite. A demonstração financeira usa dados **fictícios** de junho a agosto de 2026. Cada total por categoria é a soma exata dos lançamentos exibidos, como numa fatura de verdade.

## Executar

```bash
cd frontend
npm install
npm run dev
npm run build
```

A página inicial está em `/`. A rota `/register` cria a conta e `/login` abre a sessão, ambas pela API em `/api/auth`. O Vite encaminha `/api` para `http://127.0.0.1:8000`; use `GERENCIA_API_URL` para outro endereço. Se a API estiver fora do ar, a página pública e a demonstração continuam funcionando, e o cabeçalho mostra os links de entrada.

## Estrutura atual

A página é uma vitrine do produto: abertura em petróleo com a Figura 1, blocos arredondados que alternam branco, petróleo e menta sobre um chão sálvia, e figuras e tabelas com legenda e linha "Fonte:".

- `src/pages/ExperiencePage.tsx`: página inicial para visitantes, dividida em uma função por seção. Quem já está logado vai para `/app`.
- `src/pages/RegistrationPage.tsx`: cadastro, com validação local e os erros por campo que a API devolve.
- `src/pages/LoginPage.tsx`: entrada com e-mail e senha.
- `src/pages/PanelPage.tsx` e `src/components/panel/`: painel em `/app`, arquivos e dados da conta, com barra lateral responsiva.
- `src/components/panel/PanelOverview.tsx`: consulta `/api/dashboard` e escolhe entre a visão vazia e o painel com dados da própria conta.
- `src/components/panel/PanelDashboard.tsx`: dashboard analítico da segunda versão da `main`, com meses, categorias, lançamentos e recorrências.
- `src/components/panel/PanelHome.tsx` e `PanelEmptyState.tsx`: saudação, indicadores e gráficos vazios enquanto não há transações; arquivos recentes vêm da API.
- `src/components/panel/FilesSection.tsx`: envio, histórico e exclusão em `/app/files`. `/app/uploads` é um endereço alternativo para a mesma tela.
- `src/panel/api.ts`: contratos e chamadas de arquivos e dashboard; reutiliza o cliente HTTP de `src/auth/api.ts`.
- `src/auth/api.ts` e `src/auth/AuthContext.tsx`: cliente da API e estado da sessão (`useAuth`).
- `src/components/site/`: cabeçalho e rodapé da página inicial e a lista das seções usada pelos dois.
- `src/components/AccountHeader.tsx`: cabeçalho das páginas de entrar e de criar conta.
- `src/components/DemoLink.tsx`: link das figuras que abre um recorte da demonstração na mesma página.
- `src/auth/useRedirectSignedInUser.ts` e `src/hooks/usePageTitle.ts`: levam quem já está logado para o painel e trocam o título da aba.
- `src/components/FormFields.tsx`: campo com rótulo, dica e erro, e campo de senha com mostrar e ocultar.
- `src/components/Brand.tsx` e `src/components/BarsMark.tsx`: logo com o nome e o símbolo das três barras, também usado como enfeite.
- `src/components/CitedFigure.tsx`: Figura 1. Pilha de faturas com uma aba por mês. Cada total por categoria tem uma nota com os maiores lançamentos e a soma de todos.
- `src/components/SourceTable.tsx`: Tabela 1, a mesma compra como linha do arquivo CSV e como lançamento organizado.
- `src/components/GroundChart.tsx`: gastos diários do trimestre, desenhados bem apagados no fundo da seção de números.
- `src/components/Icon.tsx`: ícones de traço usados nos cartões e nas listas.
- `src/components/ReadingsFigure.tsx`: Figura 2, três leituras (2a, 2b, 2c) que abrem o recorte correspondente da demonstração.
- `src/components/dashboard/demoData.ts`: registros fictícios originais, incluindo a descrição bruta de cada lançamento.
- `src/components/dashboard/demoModel.ts`: totais, percentuais, variações e textos derivados em um só lugar.
- `src/components/dashboard/ConnectedDashboard.tsx`: Figura 3, que junta os blocos da demonstração: `MetricStrip.tsx` (números do topo), `CategoryBlock.tsx` e `CategoryChart.tsx` (gráfico Recharts e lista das categorias) e `TransactionsBlock.tsx` (tabela de lançamentos).
- `src/hooks/useDemoExperience.ts`: estado do período, categoria e gráfico refletido na URL.
- `src/hooks/useMobileMenu.ts`: menu das telas estreitas, que fecha com Esc e quando o foco sai dele; usado no cabeçalho e no painel.
- `src/styles/`: tokens, componentes base, página pública, figuras, demonstração e painel. `overview.css` atende à visão vazia; `panel-data.css` ao painel com dados e à tela de arquivos.

A fonte Inter Tight é servida localmente em `public/fonts/`, com a licença OFL ao lado. O painel e a prévia de análise são carregados sob demanda, sem antecipar seus gráficos na página pública. As animações respeitam a preferência por movimento reduzido.

## Estado compartilhável

Os parâmetros `period`, `category` e `chart` na URL guardam o recorte escolhido. Por exemplo: `/?period=ago&category=Alimentação&chart=bar#demo-categories`. Os links da Figura 2 abrem a demonstração no contexto correspondente, e recarregar mantém a seleção. A preferência de ordenação pode ser salva em `localStorage`; se o armazenamento estiver bloqueado, a página continua funcionando.

## Verificação

O [guia das verificações](../scripts/frontend/README.md) contém a preparação
das ferramentas de teste e os comandos com o ambiente virtual do projeto.

Com o servidor local aberto em `http://127.0.0.1:5173` (ou com `GERENCIA_TEST_URL` apontando para outra porta):

```bash
python scripts/frontend/check_front_experience.py
python scripts/frontend/check_front_experience_a11y.py
python scripts/frontend/check_figures.py
python scripts/frontend/check_dashboard.py
```

`check_auth_flow.py` cria usuários de verdade e por isso exige a API ligada a um banco descartável; veja o [guia das verificações](../scripts/frontend/README.md).

Os scripts usam Playwright e axe para conferir as notas da Figura 1, os recortes da Figura 2, filtros, URL, menu móvel, armazenamento bloqueado, acessibilidade e larguras de 320, 390, 768 e 1440 px. Capturas ficam em `.impeccable/review/` na raiz do repositório.

## Integração com a API

Cadastro, login, saída, envio e histórico de arquivos usam a API de verdade,
com a sessão num cookie que o JavaScript não lê. O banco precisa estar na
revisão Alembic `0002_upload_history` para usar arquivos. O painel pessoal não
usa os dados fictícios da página pública: sem transações, mostra estados vazios;
com transações, mantém o dashboard analítico da segunda versão da `main`.
`DashboardData` descreve a resposta de `/api/dashboard`. Cálculos e autorização
continuam no backend. O upload mantém o contrato da `main`: corpo bruto do
arquivo e nome na URL, sem multipart.

Nesta etapa de preparação, a validação é por compilação e conferência da
interface e integração em banco temporário. Não foram escritos ou executados
testes unitários, nem desenvolvidas novas análises. O protótipo de janela de
envio continua em `.impeccable/prototypes/`, fora do produto e do Git.
