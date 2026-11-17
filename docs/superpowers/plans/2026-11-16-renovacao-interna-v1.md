# Plano de implementação — nova interface, simplificação e conclusão da v1

Data: 16 de novembro de 2026. Branch: `Janio`.

Base: [interface e simplificação aprovadas](../specs/2026-11-16-refatoracao-geral-v1-design.md), documento aprovado a partir de `72d6488`, e [contratos financeiros e funcionais](../specs/2026-11-16-renovacao-interna-v1-design.md), originalmente aprovados em `56d69a8`. Valem A01–A19 e R01–R07; A03 usa a redação atualizada da nova especificação.

Estado: **execução autorizada pelo usuário e iniciada** a partir de `0134cbf`. As caixas sem marcação continuam pendentes de integração e evidência, mesmo quando existir código em preparação.

**Escopo atualizado em 17/11:** [IA fora desta etapa e Vercel como hospedagem](../specs/2026-11-17-escopo-sem-ia.md). P15/P16 e A12/A13 estão adiados; não criar diagnóstico, treino ou predição agora. As dependências e verificações de outras tarefas não aguardam IA. Arquivos têm limite de 4 MB para compatibilidade com a hospedagem.

A skill complementar `writing-plans` continua indisponível: a busca por diretório e conteúdo nos diretórios de skills e cache foi repetida nesta revisão. O plano foi atualizado diretamente a partir das especificações aprovadas, do inventário do código e da revisão dos três especialistas; não se declara aplicação daquela skill.

## 1. Resultado e organização

Entregar a primeira versão até **27 de novembro de 2026**, com visual **Categorias em destaque**, tema claro petróleo/menta, categorias com cores/ícones, comparação entre dois meses escolhidos, resumo gráfico de recorrências e até cinco lançamentos recentes. Concluir Painel, Arquivos, Transações, Limites e Conta, mantendo a arquitetura e as funções documentadas. Página pública, demonstração, login e cadastro ficam fora do redesenho inicial, com regressões verificadas quando houver mudanças compartilhadas.

Prioridade funcional: consistência financeira → consultas completas → painel/Transações → correções de categoria → limites/avisos → fechamento e ensaio. O protótipo de P07 começa após P00, sem esperar todo o backend. Arquivos e Conta avançam quando seus contratos estiverem prontos.

| Frente | Tarefas e resultado |
| --- | --- |
| Experiência visual | P07–P09 e P12–P14: protótipo revisável, identidade comum e fluxos reais nas cinco abas |
| Simplificação do código | S01–S04 e P17: transporte/formatação compartilhados, estilos internos isolados, remoções comprovadas e evolução do legado |
| Sustentação funcional | P00–P06 e P10–P11: dados confiáveis, consultas completas, regras e persistência |
| Validação e entrega | P18–P19: execução, regressões, documentação, evidências e ensaio |

Responsabilidades:

| Responsável | Implementação e revisão principais |
| --- | --- |
| Principal/integrador | Contratos públicos, modelos/exportações, Alembic, registro das rotas, clientes/tipos da API, S01/S02/S04, integração e aceites finais |
| Especialista em dados | Pipeline puro, elegibilidade financeira, estatísticas, calendário, deduplicação pura, fixtures e testes com resultados manuais |
| Especialista em backend | Serviços/repositórios/rotas de domínio, transações atômicas, autorização, concorrência, limites e avisos |
| Especialista em interface | Componentes e estilos internos, protótipo, mapa de categorias, gráficos Recharts, S03, acessibilidade e verificações de interface |

São no máximo quatro agentes simultâneos, incluindo o integrador. A frente de simplificação não cria um quinto agente: seus arquivos são distribuídos entre os donos existentes. Nesta revisão, três agentes fizeram leituras independentes de experiência, código e semântica financeira; cada um devolveu ajustes ao plano.

Um arquivo tem um único editor por vez. Ficam sob integração exclusiva do principal `backend/app/models/entities.py`, `models/__init__.py`, `backend/migrations/versions/`, `backend/tests/conftest.py`, `backend/app/api/main.py`, `frontend/src/App.tsx`, `main.tsx`, `pages/PanelPage.tsx`, `auth/api.ts`, `panel/api.ts` e os novos helpers compartilhados. Arquivos de pipeline ficam com dados; serviços/repositórios com backend; componentes e `panel*.css` com interface. Os especialistas entregam propostas ao principal nos arquivos compartilhados. Transferências de propriedade são explícitas antes da edição.

Manter a branch `Janio` e commits pequenos por tarefa integrada. Não fazer push, merge remoto ou publicar ao preparar o plano. Não instalar dependências de produto, aplicar migrações no banco de uso ou disparar chamadas reais de IA durante esta revisão.

Antes do primeiro lote, registrar o SHA de partida e confirmar a árvore limpa. A `main` permanece intacta; os commits da `Janio` preservam também avanços que ainda não existem nela. Recuperar código não desfaz mudanças de banco: migrações são testadas separadamente e a evolução do banco de uso exige cópia de segurança e procedimento operacional de P18. Usar UI/UX Pro Max e frontend-design no protótipo e na interface, sem trocar a stack ou adicionar infraestrutura para obter o novo visual.

## 2. Contratos e decisões de execução

### 2.1 Dados e API

- Dinheiro novo: `Decimal` no backend e texto decimal no JSON, por exemplo `"90.00"`. Valores absolutos nos itens; natureza explícita determina sua contribuição ao gasto. Totais líquidos podem ser negativos.
- Indisponibilidade é dado explícito, com valor `null` e motivo, em vez de zero artificial. Percentuais já vêm calculados pelo backend, acompanhados da convenção usada para apresentação.
- Consultas novas de análise e transações aceitam mês resolvido pelo servidor: `latest`, `all` ou `AAAA-MM`. O painel abre em `latest`; a resposta informa o mês efetivo. Limites recebem sempre `AAAA-MM` explícito.
- Comparação livre: mês analisado e referência são dois `AAAA-MM` distintos, com registros do próprio usuário. DTOs transportam ambas as bases, união das categorias, diferenças, percentuais e motivos de indisponibilidade. Diferença = analisado − referência; percentual só quando a referência é positiva. Categoria sem movimento em mês existente pode valer zero; mês sem registros não vira zero. `all` não recebe comparação mensal. A referência inicial usa o calendário anterior quando disponível, ou fica sem seleção.
- Recorrências: detecção no histórico completo; valores observados no período escolhido e base mensal histórica são campos distintos. Uma transação elegível é contabilizada uma vez, ainda que o serviço seja assinatura pelo nome e recorrência confirmada. Base mensal = gasto no último mês observado do próprio serviço; anualização = base × 12, com mês-base explícito e independente do filtro. Não prever cobranças.
- Recentes: consulta do servidor devolve até cinco transações do período e usuário, com ordenação estável e identificador; lista completa continua paginada. Não extrair os recentes de uma lista previamente truncada a 300.
- Transações também aceitam `date_from`/`date_to`, mutuamente exclusivos com mês, `category_id`, `merchant`, `q`, `min_amount`, `max_amount`, ordenação permitida, página e tamanho. Página inicial 1; tamanho padrão 25, máximo 100. Validar limites e intervalos antes da consulta.
- Filtros de natureza/elegibilidade permitem investigar a composição do gasto e consultar duplicatas excluídas. O link do painel usa compras, tarifas e estornos elegíveis; a tabela identifica o que entra ou fica fora do total.
- Resposta paginada: itens com UUID/origem, quantidade total, página/tamanho, filtros efetivos e agregados do conjunto completo filtrado. Ordenação tem desempate por UUID; ordenação não é SQL livre enviado pelo navegador.
- `/api/dashboard` mantém nomes e tipos legados por adaptador de saída. Os endpoints `/api/analytics/` e a fachada compartilham os cálculos, sem duas versões das regras.
- Todas as consultas financeiras partem da sessão. Recurso de outro usuário responde 404; o cliente nunca fornece `user_id`.

### 2.2 Fronteiras simples

Manter leitores em `pipeline/previa.py` e a orquestração da análise em `pipeline/analise.py`. Extrair somente funções com responsabilidade clara: deduplicação pura, estatísticas ou categorização quando o tamanho/reuso justificar. Não dividir por quantidade de linhas nem criar um framework de processamento.

Consultas financeiras passam a um repositório de transações compartilhado. Serviços de analytics e limites reutilizam a mesma projeção e as mesmas regras; não replicam fórmulas no React ou em SQL independente. A lista paginada e os agregados são consultas distintas sobre os mesmos filtros e elegibilidade.

Cada mutação que altera gasto ou duplicidade usa a mesma disciplina de bloqueio por usuário na transação do PostgreSQL, evitando dupla contabilização em requisições concorrentes.

### 2.3 Migrações e dados históricos

Reservar uma única sequência linear, coordenada pelo principal:

| Revisão proposta | Conteúdo | Momento |
| --- | --- | --- |
| `0002_financial_core` | Metadados de upload, `income`, identificador bancário, evidências de origem e suspeitas necessárias | Antes da persistência financeira corrigida |
| `0003_budgets_notifications` | Limites mensais, notificações e unicidade das faixas | Antes do serviço de limites |
| `0004_remove_legacy` | Retirada dos campos e estruturas legadas aprovados, depois de preservar rastreabilidade | Após todos os consumidores deixarem de depender deles |

O rascunho não commitado de `0004_monthly_insights`, testado apenas em bancos descartáveis, foi retirado após a mudança de escopo. Isso não altera a revisão inicial nem uma migração aplicada no banco de uso.

O DDL concreto de cada revisão acompanha seu modelo e teste. Nunca editar `0001_current_schema`, seu SQL congelado ou sua assinatura. Preservar UUIDs, códigos numéricos, relações e dados comprováveis. Informação histórica não recuperável permanece identificada como desconhecida; não converter `other` em `income` apenas por suposição.

Testes do contrato legado continuam instalando explicitamente `0001`; novos testes de v1 instalam `head`. O helper de instalação deve aceitar a revisão, sem fazer os testes antigos de bronze/mapeamento exigirem essas tabelas no esquema final. A adoção de banco existente continua validando/stampando a baseline e depois segue por upgrade normal.

## 3. Sequência das tarefas

As caixas representam trabalho futuro. Arquivos com a indicação **novo** ainda serão criados. Os comandos de verificação estão na seção 4 e só serão executados na implementação, em ambiente descartável.

Abreviações de caminhos: `pipeline/`, `services/`, `repositories/`, `schemas/`, `api/` e `models/` pertencem a `backend/app/`; `tests/` a `backend/tests/`; `migrations/` a `backend/migrations/`. Componentes internos sem prefixo estão em `frontend/src/components/panel/`; `pages/`, `panel/` e `styles/` no frontend estão sob `frontend/src/`.

### P00 — Fixar contratos, fixtures e ponto de partida

**Responsável:** principal, com revisão de dados e backend. **Depende de:** aprovação deste plano. **Aceites:** preparação de A01–A19 e R01–R07.

**Arquivos:** `backend/tests/conftest.py`, `backend/tests/fixtures/finance/` (**novo**), schemas existentes e contratos definidos neste plano.

- [ ] Confirmar branch/estado, ferramentas disponíveis e resultado inicial da suíte e do build. Registrar falhas preexistentes separadamente.
- [ ] Confirmar, sem imprimir segredos, configuração e disponibilidade do ambiente de apresentação na Vercel. Não criar conta ou contratar serviço.
- [ ] Separar fixtures da baseline e de `head`; reutilizar o cluster PostgreSQL temporário já existente, que ignora o `DATABASE_URL` de uso.
- [ ] Montar exemplos pequenos: compra 100, tarifa 10, estorno 20, receita 1.000, pagamento 500; quatro despesas 10/20/30/40; categoria negativa; agosto/outubro com lacuna; mais de 300 itens; dois usuários.
- [ ] Consolidar nomes/campos dos DTOs em schemas e tipos apenas no início da implementação, antes de distribuir arquivos dependentes.
- [ ] Registrar a retirada da IA do escopo desta etapa; não criar identidade, persistência ou configuração de diagnóstico sem consumidor atual.

**Concluir quando:** o resultado inicial é conhecido, fixtures têm respostas manuais e os especialistas concordam com o contrato. Commit sugerido: `Prepara contratos e fixtures da renovacao interna`.

Acrescentar a P00 os casos da nova entrevista: agosto com Alimentação 100 e Transporte 50; outubro com Alimentação 80 e Saúde 30; setembro ausente. Outubro versus agosto dá total −40 e percentual de aproximadamente −26,67%; Saúde tem +30 e percentual indisponível, Transporte −50 e −100%. Cobrir mês de receita sem gasto, referência líquida negativa e mês em andamento.

Para serviços, usar Netflix 20 em agosto e duas cobranças legítimas distintas de 20 em outubro: histórico 60, outubro/base mensal 40 e anualizado 480, sem dupla contagem pelas classificações. Spotify só em agosto, 15: gasto de outubro sem cobrança observada; base agosto 15 e anualizado 180 não mudam com o filtro. Incluir parcela, duplicata confirmada e estorno sem vínculo, sem associação inventada. Fixar dados conhecidos para validar os cinco recentes e os casos após a posição 300.

### S01 — Compartilhar o transporte HTTP

**Responsável:** principal; revisão de backend e interface. **Depende de:** P00; integrar antes da ampliação dos clientes em P06/P14. **Aceites:** R05, R06.

**Arquivos:** `frontend/src/lib/api.ts` (**novo**), `auth/api.ts`, `panel/api.ts` e consumidores de `ApiError` quando necessário.

- [ ] Extrair transporte e erro comuns, preservando JSON, upload bruto, headers, cookie, mensagens, erros de campo, resposta 204 e tratamento de corpo não JSON.
- [ ] Aceitar cancelamento por `AbortSignal` sem convertê-lo em erro de conexão. A política de redirecionar sessão expirada continua nos consumidores apropriados.
- [ ] Usar reexport temporário somente quando necessário à transição; retirar pontes sem consumidores no fechamento.

**Concluir quando:** build, entrada/saída e upload/exclusão continuam funcionais. Estender os scripts existentes apenas para casos de erro não cobertos pelo percurso; sem framework de testes frontend. Usar V3/V5 e percurso de upload/exclusão na API descartável; repetir a integração em V6 quando disponível, sem bloquear esta extração até P19. Commit: `Compartilha transporte HTTP preservando acesso e upload`.

### S02 — Unificar formatação sem mudar as métricas

**Responsável:** principal; interface revisa consumidores. **Depende de:** P00; pode avançar junto de S01, sem dois editores nos clientes. **Aceites:** R05.

**Arquivos:** `frontend/src/lib/format.ts` (**novo**), `panel/api.ts`, `components/dashboard/demoData.ts`, `demoModel.ts`, consumidores e página de teste enquanto existir.

- [ ] Compartilhar moeda/percentual, aceitando valores decimais dos novos DTOs e números legados/fictícios. Indisponibilidade fica explícita nos componentes.
- [ ] Preservar escala: a variação da demo em pontos percentuais não pode ser formatada como fração sem conversão de apresentação documentada. Não mover fórmulas reais ao React.
- [ ] Conferir BRL negativo, centavos e precisão visual, além dos consumidores da demonstração pública.

**Concluir quando:** build e scripts existentes de demo/figuras preservam valores e rótulos. Usar V3/V5. Commit: `Centraliza formatacao de moeda e percentuais`.

### P01 — Adicionar suporte persistente ao núcleo financeiro

**Responsável:** principal; revisão de backend. **Depende de:** P00. **Aceites:** A06, A15, A17.

**Arquivos:** `models/entities.py`, `models/__init__.py`, `migrations/versions/0002_financial_core.py` (**novo**), `tests/test_financial_migrations.py` (**novo**), `tests/test_alembic.py` e fixtures de banco.

- [ ] Acrescentar tipo/formato/período observado ao upload; aceitar `income`; preservar identificador bancário, saldo/vínculo quando fornecidos e a distinção entre suspeita e duplicata confirmada.
- [ ] Manter campos legados durante a transição. Preencher metadados antigos somente com evidência do relatório/registro existente; registrar o que não puder ser recuperado.
- [ ] Definir índices e restrições necessários, sem índice único que impeça guardar as cópias duplicadas para rastreabilidade.
- [ ] Testar instalação nova e evolução de `0001` com dados, verificando valores, UUIDs, códigos e relações.

**Concluir quando:** upgrade preserva os dados e os modelos refletem o esquema da revisão. Usar V1/V4. Commit: `Evolui esquema para o contrato financeiro da v1`.

### P02 — Corrigir leitura e normalização sem reescrever os leitores

**Responsável:** dados. **Depende de:** P00; integração persistida depende de P01. **Aceites:** A01, A06, A07.

**Arquivos:** `pipeline/previa.py`, `pipeline/analise.py`, `tests/test_previa_fatura.py`, `tests/test_importacao_extrato_modelo.py` (**novo**) e fixtures.

- [ ] Remover a decisão por maioria de sinais da planilha-modelo; receber o tipo de documento e aplicar sua convenção fixa.
- [ ] Normalizar tipos, valores absolutos e centavos sem perda de precisão; preservar identificador bancário, saldo, parcelas e linha de origem.
- [ ] Distinguir compras, tarifas, estornos, pagamentos e receitas com evidência do formato. Natureza desconhecida permanece explícita.
- [ ] Cobrir CSV/XLSX, encoding/delimitador, cabeçalho, colunas obrigatórias e opcionais, datas e valores inválidos. Preservar as rejeições e seus motivos.

**Concluir quando:** acrescentar receitas ao mesmo arquivo não inverte uma saída já existente; `0,10 + 0,20` preserva `0,30`; tipos/identificadores/saldo sobrevivem à leitura. Usar V1. Commit: `Corrige sinais e tipos na importacao financeira`.

### P03 — Integrar deduplicação, qualidade e exclusão de upload

**Responsável:** backend; dados entrega a decisão pura. **Depende de:** P01 e P02 para iniciar; P04 para concluir a reconciliação financeira. **Aceites:** A05–A07, A14, A15.

**Arquivos:** `pipeline/duplicatas.py` (**novo**), `services/uploads.py`, `repositories/uploads.py`, `api/uploads.py`, `schemas/uploads.py`, `tests/test_duplicatas.py`, `tests/test_uploads.py` e `tests/test_qualidade.py` (**novos**).

- [ ] Implementar classificação e seleção canônica sem banco no módulo puro, usando a chave/desempate da especificação. Suspeitas sem identificador continuam contabilizadas.
- [ ] No serviço, bloquear as mutações do usuário antes de conferir/gravar sobreposições. Reenvio por hash aponta para o existente; conflito de data/valor/natureza cancela o novo processamento inteiro.
- [ ] Gravar upload, transações, rejeições e qualidade em uma transação. Conferir as quatro dimensões, linhas, categorias com a função financeira de P04 e saldo quando disponível; indisponibilidade do saldo não é aprovação fictícia.
- [ ] Completar detalhe, qualidade e download das rejeições. Manter o relatório como evidência do processamento, distinto da análise atual após correções.
- [ ] Ao excluir upload, promover a cópia remanescente elegível, reavaliar os meses afetados e manter o total econômico correto.
- [ ] Testar uploads concorrentes, falha de reconciliação sem gravação parcial e isolamento A/B.

**Concluir quando:** duas compras iguais sem identificador permanecem; cópias confirmadas contam uma vez; excluir a cópia contabilizada preserva o total pela remanescente. Usar V1/V2. Commit: `Conclui qualidade e deduplicacao atomica dos uploads`.

### P04 — Unificar análises, estatísticas, calendário e recorrência

**Responsável:** dados; revisão de backend. **Depende de:** P02 e contrato de duplicidade fixado em P00; não depende da gravação de P03. **Aceites:** A01, A03 atualizado, A04, R02, R03.

**Arquivos:** `pipeline/analise.py`; `pipeline/estatisticas.py` (**novo, se extração concentrar essa responsabilidade**); `tests/test_analise_financeira.py`, `tests/test_estatisticas.py`, `tests/test_periodos_recorrencias.py` (**novos**).

- [ ] Centralizar a elegibilidade: gasto líquido usa compras + tarifas − estornos; receitas/pagamentos separados; duplicatas confirmadas excluídas e suspeitas mantidas.
- [ ] Calcular categorias, estabelecimentos, maiores despesas, contagens e estatísticas do conjunto completo. Não usar o limite da lista de itens para calcular métricas.
- [ ] Entregar média, mediana, modas, mínimo/máximo/amplitude, desvio populacional, quartis/IQR e histograma. Documentar tratamento de empates, limites das faixas e arredondamento; testar inclusão das bordas e soma das frequências.
- [ ] Devolver indisponibilidade para desvio/quartis/IQR com menos de quatro despesas. Para `[100, 10]`, média/mediana 55 e essas medidas indisponíveis. Para `[10, 20, 30, 40]`, média/mediana 25, Q1 17,50, Q3 32,50, IQR 15 e desvio arredondado 11,18.
- [ ] Separar comparação livre de dois meses explícitos do indicador mês anterior do calendário. Usar analisado menos referência e percentual somente com referência positiva; incluir a união das categorias e diferenciar categoria ausente de mês inexistente. Tratar lacunas, mês parcial e visão histórica. Meses disponíveis incluem receitas, pagamentos e estornos, mesmo sem compras. Composição inválida não recebe participação percentual.
- [ ] Detectar recorrência no histórico completo, com pelo menos dois meses, sem parcelas; permitir dupla classificação sem dupla contagem. Separar valor observado no período de base mensal do último mês observado de cada serviço e anualização ×12, identificando lacunas e mês-base, sem previsão de datas.
- [ ] Conferir os casos de P00, incluindo duas cobranças legítimas do serviço no mesmo mês e anualização invariável à troca de filtros. Estorno sem vínculo não recebe associação inventada.

**Concluir quando:** o exemplo financeiro resulta em 90; estorno de Saúde 50 deixa total 40 e categoria −50 sem rosca/percentuais; outubro compara com agosto quando ambos são escolhidos, mas continua sem comparação chamada mês anterior na ausência de setembro. Recorrências e assinaturas somam transações uma única vez. Usar V1. Commit: `Unifica analises financeiras e estatistica descritiva`.

### P05 — Entregar API de Transações e consultas compartilhadas

**Responsável:** backend; principal integra rotas e contratos. **Depende de:** P03 e P04. **Aceites:** A02, A08, A15, R04.

**Arquivos:** `repositories/transactions.py`, `services/transactions.py`, `api/transactions.py`, `schemas/transactions.py` (**novos**); extração da consulta de categorias de `api/main.py` para serviço/repositório; `tests/test_transactions.py` (**novo**).

- [ ] Criar uma definição de filtros validada e reutilizável para projeção, contagem e agregados. Aplicar usuário e filtros antes de ordenar/paginar.
- [ ] Implementar listagem e detalhe com UUID, upload/linha, natureza, categoria, contribuição e duplicidade; nunca carregar todos os itens no navegador para obter o total.
- [ ] Oferecer a projeção dos cinco recentes ao serviço de analytics, sobre os filtros e usuário corretos, com ordenação estável; ela não usa o corte de 300 itens da implementação anterior.
- [ ] Preservar o endpoint existente de categorias globais ao separar suas responsabilidades; não adicionar CRUD de categorias.
- [ ] Testar combinações de filtros, intervalos inválidos, tamanho máximo, ordenação estável, mais de 300 itens e acesso a recurso de outro usuário.

**Concluir quando:** o lançamento após a posição 300 pode ser encontrado, sem mudar os agregados ao trocar de página. Usar V2. Commit: `Adiciona consulta completa e paginada de transacoes`.

### P06 — Expor analytics e integrar os tipos no cliente

**Responsável:** principal; backend revisa consultas e dados revisa resultados. **Depende de:** P04, P05 e S01/S02 nos clientes. **Aceites:** A01–A04, A08, A15, R02–R04.

**Arquivos:** `services/analytics.py`, `api/analytics.py`, `schemas/analytics.py`, `tests/test_analytics.py` (**novos**); `api/dashboard.py`, `services/uploads.py`, `repositories/uploads.py`, `api/main.py`, `frontend/src/panel/api.ts`.

- [ ] Expor resumo, categorias, estabelecimentos, evolução, maiores despesas e comparação conforme o planejamento. Resolver período/meses disponíveis no servidor.
- [ ] Fixar comparação em `/api/analytics/comparison` com `month` e `reference_month`, ambos `AAAA-MM`; rejeitar meses iguais, inválidos ou sem registros do próprio usuário. Retornar períodos explícitos, cobertura, união de categorias, ambas as bases, diferenças e percentual nulo com motivo quando indisponível. O frontend não calcula esses resultados.
- [ ] Expor no contrato de resumo/recorrências os cinco recentes e os serviços sem dupla contagem; manter separados gasto do período, classificações, evidência histórica, última cobrança, mês-base mensal e anualização. Usar as mesmas funções financeiras, sem criar outra API de processamento.
- [ ] Fazer todos os consumidores usarem a análise comum de P04 e as consultas de P05; manter a fachada `/api/dashboard` com adaptador de tipos legados.
- [ ] Tipar os novos DTOs no cliente, incluindo dinheiro decimal, indisponibilidade, origens e contexto. Reutilizar tratamento de erros/sessão e acrescentar cancelamento de requisição obsoleta.
- [ ] Garantir respostas financeiras sem cache público e testar que a fachada preserva seu contrato enquanto a nova interface muda de consumidor.

**Concluir quando:** APIs novas e fachada concordam nos valores, com formatos próprios documentados, e o build TypeScript passa. Usar V2/V3. Commit: `Integra contratos de analytics sem duplicar calculos`.

### P07 — Apresentar o protótipo e renovar a estrutura interna

**Responsável:** interface; principal integra navegação/API. **Depende de:** P00 para o estudo visual; S02 para integrar os controles; integração real em P06. **Aceites:** A16, R01, R05.

**Arquivos:** `PanelSidebar.tsx`, `PanelOverview.tsx`, `PanelHome.tsx`, `pages/PanelPage.tsx`, `components/Icon.tsx`, `panel/categoryPresentation.ts` (**novo**), `styles/panel.css`, `styles/panel-data.css`; componentes de período/estado em `components/panel/` quando usados em mais de uma tela. Capturas do estudo ficam em `.impeccable/review/`.

- [ ] Preparar um primeiro protótipo local revisável do Painel em desktop/celular com dados fictícios identificados e cenários P00. Mostrar ranking colorido, comparação ao lado, serviços e cinco recentes; colher ajustes antes de estender o visual às outras abas, enquanto dados/backend continuam. Usar os componentes que serão integrados, sem criar outra rota pública de análise ou persistir dados de demonstração na conta.
- [ ] Aplicar tema claro, marca, Inter Tight, petróleo na navegação e menta nas ações. Definir um único mapa das onze categorias com cor, ícone SVG e nome, fallback e contraste verificado, reutilizado em Painel, Transações e Limites.
- [ ] Aproveitar a largura disponível, reduzir cartões repetidos e padronizar título, período, ação e estados de cada área.
- [ ] Preparar links de `/app/transactions` e `/app/budgets`; ativá-los somente quando suas telas funcionarem. Preservar `/app/files` e a proteção de sessão.
- [ ] Implementar menu móvel, foco/Escape, rótulo da seção ativa, filtros compartilháveis por URL e navegação voltar/avançar. Links podem continuar recarregando a página, conforme a navegação atual.

**Entregável inicial:** protótipo mostrado com dados fictícios e ajustes registrados; isso não valida integração real. **Concluir quando:** a estrutura integrada funciona com teclado/celular, categorias mantêm identidade, estilos da estrutura já estão isolados e pública/login/cadastro continuam sem regressão. Usar V3/V5. A conclusão de P07 não espera toda a S03: o restante da apresentação é simplificado junto de P08. Commit: `Renova estrutura e navegacao da area interna`.

### S03 — Isolar estilos e simplificar apresentação

**Responsável:** interface; principal integra imports globais. **Depende de:** P00/S02; avança junto de P07 e conclui com P08, sem depender do aceite completo de P07 para começar. **Aceites:** R01, R05.

**Arquivos:** `styles/panel.css`, `styles/panel-data.css`, componentes internos e `main.tsx` quando necessário.

- [ ] Limitar seletores/variáveis novos à área interna, por exemplo `.panel-shell`, preservando tokens e base compartilhados. Mover um import para outra página não isola CSS global.
- [ ] Compartilhar controles, estados e apresentação somente onde há repetição e contrato comum comprovados. Manter modelos fictícios e dados pessoais separados; não criar plataforma genérica de gráficos.
- [ ] Retirar regras e componentes substituídos depois de verificar referências; comparar capturas da página pública e do acesso quando tocar estilos compartilhados.

**Concluir quando:** interna usa a identidade aprovada e pública/acesso preservam sua composição, com build e percursos afetados aprovados. Usar V3/V5/V6. Commit: `Isola estilos internos e simplifica apresentacao compartilhada`.

### P08 — Implementar o painel Categorias em destaque

**Responsável:** interface. **Depende de:** P06 e P07; S03 acompanha a integração; investigação integrada depende de P09. **Aceites:** A01, A03 atualizado, A04, A08, A16, R01–R04.

**Arquivos:** `PanelDashboard.tsx`, `PanelOverview.tsx`, `styles/panel-data.css`; componentes pequenos de análise e gráficos em `components/panel/`; verificação dedicada de painel em P19.

- [ ] Substituir a grade repetitiva por gasto líquido em destaque, comparação válida e maior categoria; abrir no mês mais recente com registros.
- [ ] Entregar seletores de mês analisado/referência distintos, persistidos na URL, e a comparação total/categorias. Usar anterior do calendário como referência inicial só quando disponível; caso contrário, pedir seleção. Todos os meses não recebe comparação mensal. Cancelar ou ignorar respostas obsoletas.
- [ ] Construir ranking de categorias com valores/participação apropriados e controles equivalentes ao clique. Representar negativos sem esconder seu sinal. Oferecer valores em lista/tabela; clique e controle por teclado abrem exatamente o mesmo recorte, sem informação essencial restrita ao tooltip.
- [ ] Exibir evolução diária no mês e mensal no histórico, com lacunas, eixos/tooltips legíveis e sem uma barra gigante para o único mês.
- [ ] Entregar os detalhes previstos: estatísticas completas, histograma, rosca quando válida, rankings por frequência/valor, maiores despesas e recorrências.
- [ ] Mostrar resumo de serviços e gráfico horizontal com detalhes acessíveis, classificações distintas e sem dupla contagem. Identificar período dos gastos, contexto histórico da detecção, mês-base e anualização; o filtro não muda a base histórica do serviço.
- [ ] Mostrar até cinco lançamentos recentes devolvidos pelo servidor, com acesso à lista completa em Transações. Não oferecer uma segunda tabela completa no Painel.
- [ ] Incluir observação determinística curta ligada a uma ação real. Não prometer economia nem atribuir à IA uma análise local.
- [ ] Remover o filtro local sobre a lista truncada. A investigação usa a rota de Transações e os filtros completos no servidor.

**Concluir quando:** os gráficos respondem às perguntas da entrevista e os números conferem com a API; após P09, clique e teclado abrem o conjunto correto. Comparação, serviços, cores/ícones e cinco recentes atendem R01–R04. Usar V3/V5/V6. Commit: `Entrega painel Categorias em destaque com analises completas`.

### P09 — Implementar a investigação de transações

**Responsável:** interface; principal integra rota e chamadas. **Depende de:** P05–P07. **Aceites:** A02, A08, A16, R01, R02, R04.

**Arquivos:** `components/panel/TransactionsSection.tsx` e seus componentes de filtros/detalhe (**novos**), `pages/PanelPage.tsx`, `panel/api.ts` e estilos internos.

- [ ] Entregar primeiro listagem/filtros/paginação, depois detalhe e indicação de origem/duplicidade.
- [ ] Preservar filtros na URL, reiniciar a página ao trocar filtro e distinguir vazio inicial de busca sem resultado.
- [ ] Reutilizar o mapa de categorias e validar links de categorias, estabelecimentos, serviços e lista recente. Investigar um valor da comparação precisa preservar o mês daquela coluna, inclusive o mês de referência.
- [ ] Mostrar o total do filtro e o que compõe o gasto, sem somar valores da página no React.
- [ ] Garantir que uma resposta de busca anterior não substitua a mais recente; oferecer limpar filtros e repetir requisição que falhou.

**Concluir quando:** navegar do gráfico, paginar, recarregar e voltar mantém o recorte; item posterior ao 300º é acessível. Usar V3/V5/V6. Commit: `Conclui tela de pesquisa e detalhe de transacoes`.

### P10 — Concluir correção de categoria e regra pessoal

**Responsável:** backend + interface, com arquivos distintos. **Depende de:** P03–P06 e P09. **Aceites:** A09, A15, A16.

**Arquivos:** serviços/repositórios/schemas de transações, `api/transactions.py`, `repositories/category_rules.py` e `services/categories.py` (**novos se necessários**), categorização do pipeline, componentes de Transações e testes de categorias/regras.

- [ ] Implementar `PATCH /api/transactions/{id}/category` com validação de propriedade/categoria e confirmação pela API.
- [ ] Permitir salvar regra para importações futuras do estabelecimento normalizado; respeitar a precedência e não recategorizar o histórico.
- [ ] Ao confirmar a correção, atualizar as consultas afetadas. A mudança e suas consequências no banco são atômicas.
- [ ] Conectar os avaliadores de limite de P11 quando estiverem disponíveis, sem emitir efeitos antes do commit ou criar dependência circular.
- [ ] Testar categoria de outro usuário, regra prioritária em novo upload, falha de edição e conservação do gasto total após recategorizar.

**Concluir quando:** só o item corrigido muda agora; importação futura aplica a regra; categoria e telas consumidoras refletem o resultado. Usar V1/V2/V6. Commit: `Conclui correcao de categorias e regras pessoais`.

### P11 — Implementar limites e notificações no backend

**Responsável:** backend; principal integra modelos/migração. **Depende de:** P06 e P10 para integração dos eventos. **Aceites:** A10, A11, A15, A17.

**Arquivos:** revisão `0003_budgets_notifications`, entidades/exportações; `api/`, `schemas/`, `services/` e `repositories/` de budgets/notifications (**novos**); `tests/test_budgets.py`, `tests/test_notifications.py` (**novos**); pontos de mutação de upload/categoria.

- [ ] Criar limite mensal ativo por usuário/categoria/período, valor positivo em BRL e proteções de propriedade da categoria no banco.
- [ ] Consultar gasto/percentual/restante a partir da análise comum; excesso conserva percentual acima de 100% e restante negativo.
- [ ] Avaliar apenas o mês corrente para novos avisos, em upload/exclusão/categoria/regra/limite. Histórico continua consultável.
- [ ] Garantir unicidade `(user_id, category_id, month, threshold)` mesmo sob concorrência e após excluir/recriar limite. Avisos anteriores permanecem como histórico.
- [ ] Implementar listagem, contador e leitura individual/todas, sempre limitadas ao usuário.
- [ ] Testar 79%, 80%, 100%, 101%, salto direto para 110%, oscilação, recriação, mês anterior e duas mutações simultâneas.

**Concluir quando:** gasto, regras das faixas e contador conferem, sem avisos repetidos. Usar V2/V4. Commit: `Adiciona limites mensais e avisos persistentes`.

### P12 — Concluir Limites e sininho na interface

**Responsável:** interface; principal integra shell/DTOs. **Depende de:** P07 e P11. **Aceites:** A10, A11, A16, R01.

**Arquivos:** `components/panel/LimitsSection.tsx`, `NotificationsMenu.tsx` (**novos**), `PanelPage.tsx`, cliente API e estilos internos.

- [ ] Entregar criação/alteração/remoção do limite, situação por mês e categorias sem limite.
- [ ] Aplicar cor/ícone/nome do mapa comum; atenção e excesso usam estado semântico e texto, sem confundir a cor da categoria com erro.
- [ ] Mostrar barra acompanhada de valor/percentual/texto, preservando excesso e valores líquidos negativos.
- [ ] Disponibilizar sininho em todas as abas internas, contador e marcar um/todos como lidos, com foco e fechamento corretos.
- [ ] Distinguir aviso histórico do estado atual; testar formulários com erro e recuperação sem perder valores.

**Concluir quando:** o fluxo completo funciona sem cálculo financeiro local nem dependência exclusiva de cor. Usar V3/V6. Commit: `Conclui tela de Limites e notificacoes internas`.

### P13 — Finalizar Arquivos, qualidade e materiais de demonstração

**Responsável:** interface + backend, com arquivos distintos. **Depende de:** P03 e P07. **Aceites:** A06, A07, A14, A16, A19.

**Arquivos:** `FilesSection.tsx`, cliente/schemas de upload, `api/uploads.py`, `scripts/exemplos/`, materiais públicos de download e estilos internos.

- [ ] Renovar envio/histórico usando os campos reais, seleção de tipo do modelo e mensagens claras para inválido/repetido.
- [ ] Concluir detalhe das quatro dimensões, linhas rejeitadas e download. Mostrar números de origem para rastreabilidade.
- [ ] Disponibilizar modelo CSV/XLSX e exemplos fictícios de extrato/fatura com três meses suficientes para demonstrar evolução e recorrência.
- [ ] Incluir casos conhecidos de comparação livre, lacuna e serviço nas duas classificações; conciliar os valores de recorrências com suas transações. Reutilizar fixtures de P00, sem criar outro sistema de exemplos.
- [ ] Recomendar exemplos, explicar retenção das transações e confirmar exclusão dentro do produto; atualizar análises após excluir.

**Concluir quando:** uma pessoa consegue começar com um exemplo, conferir qualidade e excluir o envio; todos os links de material funcionam. Usar V2/V3/V6. Commit: `Finaliza Arquivos e exemplos da primeira versao`.

### P14 — Concluir exclusão de conta

**Responsável:** backend + interface. **Depende de:** P07; teste final inclui entidades de P11. **Aceites:** A14, A15, A16.

**Arquivos:** `api/auth.py`, `services/auth.py`, `repositories/users.py`, `AccountSection.tsx`, `auth/api.ts`/contexto quando necessário, testes de autenticação/exclusão.

- [ ] Implementar `DELETE /api/auth/me` com remoção atômica dos dependentes, revogação das sessões e encerramento do cookie.
- [ ] Apresentar nome/e-mail e confirmação explícita no produto; erro mantém a conta como ativa e permite nova tentativa.
- [ ] Renovar a composição da Conta com o shell, hierarquia e estados comuns; não limitar a entrega ao endpoint de exclusão.
- [ ] Testar com dois usuários com uploads/regras/limites/avisos preenchidos. Não excluir dados da outra conta.

**Concluir quando:** todos os dados próprios saem, sessões antigas deixam de valer e a interface retorna à página pública. Usar V2/V3/V6. Commit: `Conclui exclusao atomica da propria conta`.

### P15/P16 — IA adiada por decisão do usuário em 17/11

Não executar nesta etapa. Não criar diagnóstico textual, adaptador de provedor, treino, predição, persistência, configuração ou interface de IA. A12/A13 ficam fora dos critérios desta entrega. A decisão substitui o desenho anterior sem bloquear as demais tarefas.

### S04 — Retirar a página de teste e código comprovadamente substituído

**Responsável:** principal; dados/backend/interface revisam seus consumidores. **Depende de:** P03, P08/P09 e P13 integrados; concluir antes de P19. **Aceites:** R05–R07.

**Arquivos:** `pages/AnalysisTestPage.tsx`, `styles/analysis-test.css`, `App.tsx`, `main.tsx`; avaliar separadamente `backend/app/api/analysis.py`, seu registro e wrappers da prévia; `repositories/uploads.py` após P13.

- [ ] Conferir referências de execução, testes e documentação antes de retirar a página substituída pelo fluxo autenticado. Remover seus imports/estilos exclusivos; preservar a demonstração pública.
- [ ] Definir o destino do endereço antigo: preferir redirecionamento explícito para `/app/files`, mantendo a proteção de sessão, em vez de cair silenciosamente na landing ou deixar uma página quebrada.
- [ ] Avaliar endpoint e wrappers separadamente: `analisar_arquivo` é usado por `test_previa_fatura.py`. Preservar o consumidor legítimo ou transferir sua cobertura de formatos, inválidos e análises ao caminho real antes de remover o wrapper. Não apagar leitores compartilhados.
- [ ] Reavaliar `get_with_quality` depois do detalhe de P13; mantê-la se passou a ter consumidor. Retirar apenas funções, pontes de reexport, estilos e componentes sem uso confirmado.
- [ ] Registrar o que foi retirado e por quê, com arquivos/linhas antes e depois como dado auxiliar. Não perseguir redução de linhas pela compressão do código.

**Concluir quando:** referências remanescentes são intencionais, destino antigo funciona, build e regressões de processamento, demo, autenticação e upload passam. Usar V1/V2/V3/V5 e percurso interno; conferir novamente em V6 no fechamento. Commit: `Remove pagina de teste e duplicacoes substituidas`.

### P17 — Retirar estruturas legadas com evolução validada

**Responsável:** principal; revisão de backend. **Depende de:** P03, P06 e P10–P14 com código/esquema testados e rastreabilidade preservada. **Aceites:** A14, A15, A17.

**Arquivos:** revisão `0004_remove_legacy`, entidades/exportações, repositórios de upload, testes de migração/integridade/códigos e docs do banco.

- [ ] Inventariar referências a bronze/mapping/storage/status legado. Transferir metadados comprováveis antes da retirada; não apagar informação financeira para simplificar migração.
- [ ] Validar uma cópia sintética representativa do esquema antigo e interromper a migração com erro explicativo se houver conteúdo que não possa ser preservado conforme o desenho.
- [ ] Retirar consumidores de execução e depois estruturas aprovadas. Manter scripts/revisões históricas imutáveis e testes específicos da baseline separados do esquema final.
- [ ] Testar `0001 → head`, instalação limpa, dados/UUIDs/códigos/relações e comparação de modelos com o esquema final. Não alegar downgrade sem perda quando a reversão não puder reconstruir dados removidos.

**Concluir quando:** `alembic check` fica limpo no banco descartável final e as regras da v1 não dependem de estruturas antigas. Usar V2/V4. Commit: `Alinha esquema final a arquitetura documentada`.

### P18 — Preparar execução e versão de apresentação

**Responsável:** principal; backend revisa configuração. **Depende de:** P00 para verificar ferramentas/destino e preparar arquivos; funcionalidades integradas e P17 para validar a versão final. **Aceites:** A18, R06.

**Arquivos:** `vercel.json`, `backend/main.py`, dependências de produção, exemplos de ambiente sem segredos, guia da Vercel e READMEs. Docker não é necessário para o destino confirmado.

- [ ] Revisar os serviços Vite/FastAPI existentes na Vercel e seus rewrites, preservando mesma origem e deep links de `/app/...`. PostgreSQL continua externo à função; não criar armazenamento de arquivos originais.
- [ ] Separar execução das migrações da inicialização da API. Usar comando explícito no ambiente descartável/local; não rodar upgrade silencioso no startup.
- [ ] Validar tanto instalação nova quanto evolução de banco com dados. Na disponibilização sobre banco existente, usar uma janela sem escrita: preservar cópia de segurança, aplicar somente migrações já testadas e iniciar a versão correspondente após conferir o esquema. Não expor código que exija revisão ainda não aplicada nem prometer reversão sem perda para a retirada de legados.
- [ ] Documentar inicialização, persistência, migração, variáveis e verificação de saúde. Confirmar ferramentas do ambiente antes de fornecer o comando operacional definitivo.
- [ ] Preparar destino gratuito de apresentação e validar compatibilidade com PostgreSQL/extensões e cookie HTTPS. Publicação é uma ação final sobre uma versão testada, usando a autorização existente ou solicitando-a quando o destino ainda não estiver autorizado.
- [ ] Validar na versão hospedada login, upload, filtros e persistência após reinício; não transportar credenciais de teste para o frontend.

**Concluir quando:** o fluxo local documentado funciona e existe evidência do fluxo hospedado; se faltar destino/acesso, registrar exatamente essa parte pendente. Usar V8.

### P19 — Verificar a experiência completa, atualizar documentação e ensaiar

**Responsável:** principal com revisão cruzada dos três especialistas. **Depende de:** fluxos locais integrados de P08–P17 e S01–S04 para fechar; percurso pode crescer por lote; publicação/ensaio de P18 para aceite hospedado. **Aceites:** A01–A19, exceto A12/A13 adiados, com A03 atualizado, e R01–R07.

**Arquivos:** `scripts/frontend/check_panel_flow.py` (**novo, seguindo os scripts existentes**), scripts de experiência/autenticação/acessibilidade já presentes, `scripts/frontend/README.md`, READMEs do projeto, `PRODUCT.md`, `DESIGN.md`, docs de arquitetura/análise/banco/planejamento e `docs/roteiro-banca-v1.md` (**novo**).

- [ ] Criar verificação integrada real das abas com fixtures em servidor e banco descartáveis conhecidos. Separar esse percurso dos scripts atuais da demonstração pública; não transformar a demo fictícia em um teste dependente de conta real.
- [ ] Percorrer cadastro/login → exemplo → qualidade → painel → categoria → transações → correção → limite → aviso/leitura → exclusões/logout.
- [ ] Acrescentar comparação livre com lacuna, troca rápida dos dois meses, URL/recarregar/voltar e investigação do mês correto de cada coluna; conferir base zero/negativa e mês em andamento.
- [ ] Conferir mapa de categorias, cinco recentes e acesso à lista completa, gráfico/detalhes dos serviços, dupla classificação sem dupla contagem e anualização estável quando muda o filtro.
- [ ] Conferir atualização dos dados após cada mutação: buscar novamente os resultados da API para painel, transações, limites e avisos afetados, sem introduzir cálculo local ou cache global.
- [ ] Conferir visual em 320/768/1280/1920 px, teclado, foco, movimento reduzido e zoom real de 200%. Zoom real exige conferência do navegador; `device_scale_factor` ou transformação CSS não substituem a verificação.
- [ ] Executar a suíte completa uma vez após a última integração, o build e os fluxos afetados. Repetir depois disso somente se nova mudança/falha justificar.
- [ ] Atualizar estados documentais com evidências, alinhar `/app/files`, registrar configuração gratuita e preparar roteiro curto com dados fictícios e números reconciliáveis.
- [ ] Ensaiar tanto navegação em projetor quanto leitura no celular, com os exemplos públicos e os resultados reconciliados.
- [ ] Entregar tabela final A01–A19 e R01–R07 com comando/evidência, resultado e limitação real, distinguindo validado, parcial e bloqueado. Incluir resultados da simplificação e o que foi preservado por ter consumidor legítimo.

**Concluir quando:** os critérios obrigatórios têm evidência, documentação corresponde ao aplicativo e o percurso da banca funciona de ponta a ponta. Commit: `Valida e documenta a primeira versao para apresentacao`.

## 4. Verificações e ambiente

Executar comandos abaixo a partir da raiz do projeto, depois da aprovação da execução. São comandos planejados, não resultados já obtidos.

| Código | Verificação |
| --- | --- |
| V1 | Pytest focado nos módulos puros criados/alterados, com resultados conhecidos à mão |
| V2 | Pytest de serviço/API com fixtures PostgreSQL descartáveis e dois usuários |
| V3 | `npm --prefix frontend run build` e inspeção do fluxo alterado |
| V4 | Instalação/evolução Alembic e `alembic check` via conexão injetada do banco descartável |
| V5 | Scripts existentes da experiência pública, demo, acesso e acessibilidade afetados por estilos/estrutura compartilhados |
| V6 | Novo percurso interno com Playwright/API real em ambiente descartável, sem usar banco de uso |
| V7 | Adiado: IA excluída desta etapa por decisão explícita do usuário |
| V8 | Smoke test da hospedagem Vercel, mesma origem, sessão/upload/persistência |

Comando-base da suíte existente:

```powershell
.\.venv\Scripts\python.exe -m pytest -o pythonpath=backend -o cache_dir=.impeccable/pytest-cache-v1 backend/tests -q
```

Foco de dados, depois que os arquivos existirem:

```powershell
.\.venv\Scripts\python.exe -m pytest -o pythonpath=backend -o cache_dir=.impeccable/pytest-cache-v1 backend/tests/test_analise_financeira.py backend/tests/test_estatisticas.py backend/tests/test_periodos_recorrencias.py -q
```

Exemplo de foco de API:

```powershell
.\.venv\Scripts\python.exe -m pytest -o pythonpath=backend -o cache_dir=.impeccable/pytest-cache-v1 backend/tests/test_finance_api.py -q
npm --prefix frontend run build
```

Os testes de banco reutilizam `postgres_cluster`/`auth_client` ou fixtures equivalentes do mesmo arquivo; nunca usam o banco do `.env`. Adaptar o helper Alembic para receber conexão e revisão, mantendo o padrão atual. A verificação de migrations não deve chamar `alembic upgrade head` contra o ambiente de uso por conveniência.

Scripts atuais da interface usam `GERENCIA_TEST_URL`, `.audit-tools/` e `.audit-tools-js/` conforme seu README. Executar scripts mutantes de acesso/painel somente contra API iniciada com banco temporário confirmado pelo executor e URL definida explicitamente. Interromper se a origem/banco não puderem ser identificados; não usar a URL padrão como autorização para criar contas ou excluir dados.

Capturas e relatórios de execução ficam em `.impeccable/review/`, ignorados pelo Git; manter no repositório somente scripts e relato de evidência sem dados pessoais. Não criar uma nova infraestrutura de testes nem testes unitários de frontend.

Rastreabilidade adicional: R01 é conferido em P07/P08/P09/P12/P14; R02 em P04/P06/P08; R03 em P04/P06/P08; R04 em P05/P06/P08/P09; R05 em S01–S04 e regressões; R06 em P01/P03/P06/P11/P17/P18; R07 em S04/P19. P19 reúne a evidência final, sem substituir a verificação proporcional em cada lote.

## 5. Dependências, prazo e tratamento de impedimentos

Linha funcional: **P00 → P01/P02 → P04 → conclusão de P03 → P05 → P06 → P08/P09 → P10 → P11 → P12–P14 → P17 → P18/P19**. P03 começa pela deduplicação pura/persistência depois de P01/P02, mas conclui a reconciliação usando P04; não há dependência inversa de P04 para P03. S01/S02 partem de P00 e entram antes de P06; não dependem das APIs novas para comprovar preservação dos fluxos existentes.

P07 tem um primeiro protótipo após P00 e uma entrega integrada após P06; S03 acompanha P07/P08 e não impede o primeiro estudo visual. P13 depende de P03/P07; P14 pode ser preparado após P07 e concluído depois das entidades dependentes. Não adiar Arquivos/Conta até o fim se houver uma frente livre. S04 espera a substituição funcional em P03/P08/P09/P13. P18 verifica ferramentas/destino em P00 e prepara execução antes do último lote quando independente.

A entrega atual não depende de IA. Hospedagem e acesso ao projeto Vercel são conferidos separadamente da validação local.

| Janela pretendida | Marco verificável |
| --- | --- |
| 16–17/11 | P00, ponto de recuperação, S01/S02 e primeiro protótipo de P07 em paralelo ao núcleo financeiro |
| 18–20/11 | Núcleo/consultas P01–P06; iniciar integração do Painel/Transações e avançar Arquivos/Conta pelos contratos disponíveis |
| 21–24/11 | Integrar fluxos restantes e limpeza S04 e candidata completa desejada até 24/11 |
| 25–26/11 | Regressão integrada, revisão final de migrações, ambiente de apresentação, correções e ensaio |
| 27/11 | Entrega da versão e relatório dos aceites efetivamente comprovados |

Essas janelas são metas de organização, não estimativas de esforço comprovadas ou garantia de conclusão. Incluem fim de semana sem pressupor disponibilidade humana. A cadeia de backend e a integração pelo principal concentram trabalho: reavaliar assim que P06 terminar e em 20/11 e 23/11. A data da banca segue desconhecida; o prazo de entrega é 27/11, sem presumir dias adicionais depois disso.

Reavaliar também ao concluir P12. Se houver risco de prazo, informar tarefas e aceites ainda pendentes e ajustar a ordem do trabalho independente. Não cortar estatísticas, qualidade, isolamento ou funcionalidades obrigatórias sem acordo explícito. Se a candidata não estiver pronta em 24/11, explicitar o que invade a janela de validação e tratar o risco com o usuário, sem declarar uma versão incompleta como pronta.

Impedimentos externos conhecidos e sua consequência:

- Sem acesso ao projeto da Vercel: deixar configuração/documentação revisáveis e identificar qual teste operacional ainda falta; não declarar A18 validado.
- Dados históricos sem evidência recuperável: preservar registros e explicar a limitação. Interromper apenas a conversão que dependeria de adivinhação, não o restante do trabalho independente.

## 6. Revisão e escolha da execução

Revisão desta atualização: experiência, código e dados fizeram leituras independentes. Foram incorporadas as mudanças de comparação/recorrências, quatro tarefas explícitas de simplificação, cuidados com consumidores da prévia, protótipo inicial e prazo de 27/11. A revisão final encontrou e resolveu um ciclo de conclusão entre P07/S03/P08: a estrutura de P07 fecha por seus próprios critérios, e S03 acompanha a apresentação até P08. Nenhuma verificação de produto foi executada durante a preparação documental; as caixas seguem futuras.

Forma prevista, conforme o pedido do usuário: **execução coordenada nesta conversa, com três especialistas e integração pelo principal, por lotes verificáveis**. O primeiro lote é P00, com P01/P02 e protótipo de P07 distribuídos assim que os contratos permitirem; o principal executa S01/S02 e integra contratos/migrações. Não há necessidade de perguntar novamente se o usuário prefere múltiplos agentes.

Após revisar este plano concreto, o usuário pode autorizar o início dessa execução ou solicitar ajustes. Cada lote integrado termina com revisão, verificações proporcionais e commit local, sem nova aprovação para edições rotineiras dentro do escopo autorizado. Essa escolha não declara implementação, migração em banco de uso ou publicação já feita. Push, merge e destino de publicação continuam sujeitos à autorização aplicável.
