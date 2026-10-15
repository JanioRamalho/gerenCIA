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

- `src/pages/ExperiencePage.tsx`: página inicial e sumário de navegação, com o usuário logado no cabeçalho.
- `src/pages/RegistrationPage.tsx`: cadastro, com validação local e os erros por campo que a API devolve.
- `src/pages/LoginPage.tsx`: entrada com e-mail e senha.
- `src/auth/api.ts` e `src/auth/AuthContext.tsx`: cliente da API e estado da sessão (`useAuth`).
- `src/components/FormFields.tsx`: campo com rótulo, dica e erro, e campo de senha com mostrar e ocultar.
- `src/components/Brand.tsx`: logo de três barras e nome.
- `src/components/CitedFigure.tsx`: Figura 1. Pilha de faturas com uma aba por mês. Cada total por categoria tem uma nota com os maiores lançamentos e a soma de todos.
- `src/components/SourceTable.tsx`: Tabela 1, a mesma compra como linha do arquivo CSV e como lançamento organizado.
- `src/components/GroundChart.tsx`: gastos diários do trimestre, desenhados bem apagados no fundo da seção de números.
- `src/components/Icon.tsx`: ícones de traço usados nos cartões e nas listas.
- `src/components/ReadingsFigure.tsx`: Figura 2, três leituras (2a, 2b, 2c) que abrem o recorte correspondente da demonstração.
- `src/components/dashboard/demoData.ts`: registros fictícios originais, incluindo a descrição bruta de cada lançamento.
- `src/components/dashboard/demoModel.ts`: totais, percentuais, variações e textos derivados em um só lugar.
- `src/components/dashboard/ConnectedDashboard.tsx`: Figura 3, com gráficos Recharts por categoria, filtros e tabela de lançamentos.
- `src/hooks/useDemoExperience.ts`: estado do período, categoria e gráfico refletido na URL.
- `src/styles/tokens.css`, `base.css`, `site.css`, `figures.css` e `dashboard.css`: tokens, componentes base, página, figuras e demonstração.

A fonte Inter Tight é servida localmente em `public/fonts/`, com a licença OFL ao lado. A dashboard é carregada em módulo separado. As animações (a entrada da abertura e o desdobrar da nota da Figura 1) respeitam a preferência por movimento reduzido.

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

## Integração futura

A interface consumirá a API quando autenticação e importação forem disponibilizadas. Cálculos financeiros e autorização dos dados reais pertencem ao backend.
