# Plano de implementação — renovação interna e conclusão da v1

Data: 16 de novembro de 2026. Branch: `Janio`.

Base: [especificação aprovada](../specs/2026-11-16-renovacao-interna-v1-design.md), conteúdo aprovado no commit `56d69a8`. Os identificadores A01–A19 abaixo são seus critérios de aceite.

Estado: **plano para revisão e escolha da execução**. Nenhuma tarefa de produto deste plano foi executada. A aprovação da especificação autorizou preparar este documento.

A skill complementar `writing-plans` não foi encontrada por nome de diretório ou conteúdo nos diretórios de skills e cache disponíveis. Este plano foi elaborado diretamente a partir da especificação, do inventário do código e das revisões dos especialistas; não se declara aplicação daquela skill.

## 1. Resultado e organização

Entregar a primeira versão na última semana de novembro de 2026, com visual **Categorias em foco**, petróleo/menta, poucas informações principais e detalhes acessíveis. Concluir todas as abas internas, mantendo a arquitetura, a página pública e as telas de acesso existentes.

Prioridade de execução: consistência financeira → consultas completas → painel/Transações → correções de categoria → limites/avisos → diagnóstico → fechamento e ensaio. Arquivos, Conta e apresentação visual podem avançar em paralelo quando suas dependências estiverem resolvidas.

Responsabilidades:

| Responsável | Implementação e revisão principais |
| --- | --- |
| Principal/integrador | Contratos públicos, modelos e exportações, revisões Alembic, registro das rotas, cliente/tipos da API no frontend, integração e aceites finais |
| Especialista em dados | Pipeline puro, elegibilidade financeira, estatísticas, calendário, deduplicação pura, fixtures e testes com resultados manuais |
| Especialista em backend | Serviços/repositórios/rotas de domínio, transações atômicas, autorização, concorrência, limites e IA |
| Especialista em interface | Componentes e estilos internos, gráficos Recharts, acessibilidade, estados e verificações de interface |

São no máximo quatro frentes simultâneas, incluindo o integrador. Os três especialistas já contribuíram com a decomposição e revisão dos contratos; sua avaliação nesta preparação usou as evidências e trechos repassados pelo principal.

Um arquivo tem um único editor por vez. Ficam sob integração exclusiva do principal `backend/app/models/entities.py`, `models/__init__.py`, `backend/migrations/versions/`, `backend/tests/conftest.py`, `backend/app/api/main.py`, `frontend/src/pages/PanelPage.tsx` e `frontend/src/panel/api.ts`. O especialista entrega a alteração necessária nessas interfaces ao integrador. Se não tiver ferramentas de edição, entrega proposta de patch e revisão fundamentada, para aplicação pelo principal; não se presume trabalho independente sem acesso.

Manter a branch `Janio` e commits pequenos por tarefa integrada. Não fazer push, merge remoto ou publicar ao preparar o plano. Não instalar dependências de produto, aplicar migrações no banco de uso ou disparar chamadas reais de IA durante esta revisão.

## 2. Contratos e decisões de execução

### 2.1 Dados e API

- Dinheiro novo: `Decimal` no backend e texto decimal no JSON, por exemplo `"90.00"`. Valores absolutos nos itens; natureza explícita determina sua contribuição ao gasto. Totais líquidos podem ser negativos.
- Indisponibilidade é dado explícito, com valor `null` e motivo, em vez de zero artificial. Percentuais já vêm calculados pelo backend, acompanhados da convenção usada para apresentação.
- Consultas novas de análise e transações aceitam mês resolvido pelo servidor: `latest`, `all` ou `AAAA-MM`. O painel abre em `latest`; a resposta informa o mês efetivo. Limites e diagnóstico recebem sempre `AAAA-MM` explícito.
- Transações também aceitam `date_from`/`date_to`, mutuamente exclusivos com mês, `category_id`, `merchant`, `q`, `min_amount`, `max_amount`, ordenação permitida, página e tamanho. Página inicial 1; tamanho padrão 25, máximo 100. Validar limites e intervalos antes da consulta.
- Filtros de natureza/elegibilidade permitem investigar a composição do gasto e consultar duplicatas excluídas. O link do painel usa compras, tarifas e estornos elegíveis; a tabela identifica o que entra ou fica fora do total.
- Resposta paginada: itens com UUID/origem, quantidade total, página/tamanho, filtros efetivos e agregados do conjunto completo filtrado. Ordenação tem desempate por UUID; ordenação não é SQL livre enviado pelo navegador.
- `/api/dashboard` mantém nomes e tipos legados por adaptador de saída. Os endpoints `/api/analytics/` e a fachada compartilham os cálculos, sem duas versões das regras.
- Todas as consultas financeiras partem da sessão. Recurso de outro usuário responde 404; o cliente nunca fornece `user_id`.

### 2.2 Fronteiras simples

Manter leitores em `pipeline/previa.py` e a orquestração da análise em `pipeline/analise.py`. Extrair somente funções com responsabilidade clara: deduplicação pura, estatísticas ou categorização quando o tamanho/reuso justificar. Não dividir por quantidade de linhas nem criar um framework de processamento.

Consultas financeiras passam a um repositório de transações compartilhado. Serviços de analytics, limites e IA reutilizam a mesma projeção e as mesmas regras; não replicam fórmulas no React ou em SQL independente. A lista paginada e os agregados são consultas distintas sobre os mesmos filtros e elegibilidade.

Cada mutação que altera gasto ou duplicidade usa a mesma disciplina de bloqueio por usuário na transação do PostgreSQL, evitando dupla contabilização em requisições concorrentes. Não manter transação de banco aberta durante a chamada ao provedor de IA.

### 2.3 Migrações e dados históricos

Reservar uma única sequência linear, coordenada pelo principal:

| Revisão proposta | Conteúdo | Momento |
| --- | --- | --- |
| `0002_financial_core` | Metadados de upload, `income`, identificador bancário, evidências de origem e suspeitas necessárias | Antes da persistência financeira corrigida |
| `0003_budgets_notifications` | Limites mensais, notificações e unicidade das faixas | Antes do serviço de limites |
| `0004_monthly_insights` | Diagnóstico mensal e tentativas/reservas de geração | Antes do serviço de IA |
| `0005_remove_legacy` | Retirada dos campos e estruturas legadas aprovados, depois de preservar rastreabilidade | Após todos os consumidores deixarem de depender deles |

O DDL concreto de cada revisão acompanha seu modelo e teste. Nunca editar `0001_current_schema`, seu SQL congelado ou sua assinatura. Preservar UUIDs, códigos numéricos, relações e dados comprováveis. Informação histórica não recuperável permanece identificada como desconhecida; não converter `other` em `income` apenas por suposição.

Testes do contrato legado continuam instalando explicitamente `0001`; novos testes de v1 instalam `head`. O helper de instalação deve aceitar a revisão, sem fazer os testes antigos de bronze/mapeamento exigirem essas tabelas no esquema final. A adoção de banco existente continua validando/stampando a baseline e depois segue por upgrade normal.

## 3. Sequência das tarefas

As caixas representam trabalho futuro. Arquivos com a indicação **novo** ainda serão criados. Os comandos de verificação estão na seção 4 e só serão executados na implementação, em ambiente descartável.

Abreviações de caminhos: `pipeline/`, `services/`, `repositories/`, `schemas/`, `api/` e `models/` pertencem a `backend/app/`; `tests/` a `backend/tests/`; `migrations/` a `backend/migrations/`. Componentes internos sem prefixo estão em `frontend/src/components/panel/`; `pages/`, `panel/` e `styles/` no frontend estão sob `frontend/src/`.

### P00 — Fixar contratos, fixtures e ponto de partida

**Responsável:** principal, com revisão de dados e backend. **Depende de:** aprovação deste plano. **Aceites:** preparação de A01–A19.

**Arquivos:** `backend/tests/conftest.py`, `backend/tests/fixtures/finance/` (**novo**), schemas existentes e contratos definidos neste plano.

- [ ] Confirmar branch/estado, ferramentas disponíveis e resultado inicial da suíte e do build. Registrar falhas preexistentes separadamente.
- [ ] Confirmar, sem imprimir segredos, presença da configuração necessária à futura IA e disponibilidade do ambiente de apresentação. Não criar conta ou contratar serviço.
- [ ] Separar fixtures da baseline e de `head`; reutilizar o cluster PostgreSQL temporário já existente, que ignora o `DATABASE_URL` de uso.
- [ ] Montar exemplos pequenos: compra 100, tarifa 10, estorno 20, receita 1.000, pagamento 500; quatro despesas 10/20/30/40; categoria negativa; agosto/outubro com lacuna; mais de 300 itens; dois usuários.
- [ ] Consolidar nomes/campos dos DTOs em schemas e tipos apenas no início da implementação, antes de distribuir arquivos dependentes.
- [ ] Fixar a identidade da base do diagnóstico como hash de representação canônica dos agregados/limites usados e versão das regras, com dinheiro normalizado. Os serviços anteriores à IA não precisam depender dela; geração, gravação e leitura conferem essa identidade comum.

**Concluir quando:** o resultado inicial é conhecido, fixtures têm respostas manuais e os especialistas concordam com o contrato. Commit sugerido: `Prepara contratos e fixtures da renovacao interna`.

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

**Responsável:** dados; revisão de backend. **Depende de:** P02 e contrato de duplicidade fixado em P00; não depende da gravação de P03. **Aceites:** A01, A03, A04.

**Arquivos:** `pipeline/analise.py`; `pipeline/estatisticas.py` (**novo, se extração concentrar essa responsabilidade**); `tests/test_analise_financeira.py`, `tests/test_estatisticas.py`, `tests/test_periodos_recorrencias.py` (**novos**).

- [ ] Centralizar a elegibilidade: gasto líquido usa compras + tarifas − estornos; receitas/pagamentos separados; duplicatas confirmadas excluídas e suspeitas mantidas.
- [ ] Calcular categorias, estabelecimentos, maiores despesas, contagens e estatísticas do conjunto completo. Não usar o limite da lista de itens para calcular métricas.
- [ ] Entregar média, mediana, modas, mínimo/máximo/amplitude, desvio populacional, quartis/IQR e histograma. Documentar tratamento de empates, limites das faixas e arredondamento; testar inclusão das bordas e soma das frequências.
- [ ] Devolver indisponibilidade para desvio/quartis/IQR com menos de quatro despesas. Para `[100, 10]`, média/mediana 55 e essas medidas indisponíveis. Para `[10, 20, 30, 40]`, média/mediana 25, Q1 17,50, Q3 32,50, IQR 15 e desvio arredondado 11,18.
- [ ] Corrigir comparação por mês do calendário, base zero, lacunas, mês parcial e visão histórica. Meses disponíveis incluem receitas, pagamentos e estornos, mesmo sem compras. Composição inválida não recebe participação percentual.
- [ ] Detectar recorrência no histórico completo, com pelo menos dois meses, sem parcelas, explicitando lacunas e anualização sem previsão de datas.

**Concluir quando:** o exemplo financeiro resulta em 90; estorno de Saúde 50 deixa total 40 e categoria −50 sem rosca/percentuais; outubro não compara com agosto na ausência de setembro. Usar V1. Commit: `Unifica analises financeiras e estatistica descritiva`.

### P05 — Entregar API de Transações e consultas compartilhadas

**Responsável:** backend; principal integra rotas e contratos. **Depende de:** P03 e P04. **Aceites:** A02, A08, A15.

**Arquivos:** `repositories/transactions.py`, `services/transactions.py`, `api/transactions.py`, `schemas/transactions.py` (**novos**); extração da consulta de categorias de `api/main.py` para serviço/repositório; `tests/test_transactions.py` (**novo**).

- [ ] Criar uma definição de filtros validada e reutilizável para projeção, contagem e agregados. Aplicar usuário e filtros antes de ordenar/paginar.
- [ ] Implementar listagem e detalhe com UUID, upload/linha, natureza, categoria, contribuição e duplicidade; nunca carregar todos os itens no navegador para obter o total.
- [ ] Preservar o endpoint existente de categorias globais ao separar suas responsabilidades; não adicionar CRUD de categorias.
- [ ] Testar combinações de filtros, intervalos inválidos, tamanho máximo, ordenação estável, mais de 300 itens e acesso a recurso de outro usuário.

**Concluir quando:** o lançamento após a posição 300 pode ser encontrado, sem mudar os agregados ao trocar de página. Usar V2. Commit: `Adiciona consulta completa e paginada de transacoes`.

### P06 — Expor analytics e integrar os tipos no cliente

**Responsável:** principal; backend revisa consultas e dados revisa resultados. **Depende de:** P04 e P05. **Aceites:** A01–A04, A08, A15.

**Arquivos:** `services/analytics.py`, `api/analytics.py`, `schemas/analytics.py`, `tests/test_analytics.py` (**novos**); `api/dashboard.py`, `services/uploads.py`, `repositories/uploads.py`, `api/main.py`, `frontend/src/panel/api.ts`.

- [ ] Expor resumo, categorias, estabelecimentos, evolução, maiores despesas e comparação conforme o planejamento. Resolver período/meses disponíveis no servidor.
- [ ] Fazer todos os consumidores usarem a análise comum de P04 e as consultas de P05; manter a fachada `/api/dashboard` com adaptador de tipos legados.
- [ ] Tipar os novos DTOs no cliente, incluindo dinheiro decimal, indisponibilidade, origens e contexto. Reutilizar tratamento de erros/sessão e acrescentar cancelamento de requisição obsoleta.
- [ ] Garantir respostas financeiras sem cache público e testar que a fachada preserva seu contrato enquanto a nova interface muda de consumidor.

**Concluir quando:** APIs novas e fachada concordam nos valores, com formatos próprios documentados, e o build TypeScript passa. Usar V2/V3. Commit: `Integra contratos de analytics sem duplicar calculos`.

### P07 — Renovar o shell e os controles comuns internos

**Responsável:** interface; principal integra navegação/API. **Depende de:** contrato P00; integração real em P06. **Aceites:** A16.

**Arquivos:** `PanelSidebar.tsx`, `PanelOverview.tsx`, `PanelHome.tsx`, `pages/PanelPage.tsx`, `styles/panel.css`, `styles/panel-data.css`; componentes de período/estado em `components/panel/` quando usados em mais de uma tela.

- [ ] Aplicar a hierarquia aprovada usando marca, Inter Tight e tokens atuais. Evitar alterações globais que redesenhem a página pública.
- [ ] Aproveitar a largura disponível, reduzir cartões repetidos e padronizar título, período, ação e estados de cada área.
- [ ] Preparar links de `/app/transactions` e `/app/budgets`; ativá-los somente quando suas telas funcionarem. Preservar `/app/files` e a proteção de sessão.
- [ ] Implementar menu móvel, foco/Escape, rótulo da seção ativa, filtros compartilháveis por URL e navegação voltar/avançar. Links podem continuar recarregando a página, conforme a navegação atual.

**Concluir quando:** a estrutura funciona com teclado/celular e mantém pública/login/cadastro sem regressão. Usar V3/V5. Commit: `Renova estrutura e navegacao da area interna`.

### P08 — Implementar o painel Categorias em foco

**Responsável:** interface. **Depende de:** P06 e P07; investigação integrada depende de P09. **Aceites:** A01, A03, A04, A08, A16.

**Arquivos:** `PanelDashboard.tsx`, `PanelOverview.tsx`, `styles/panel-data.css`; componentes pequenos de análise e gráficos em `components/panel/`; verificação dedicada de painel em P19.

- [ ] Substituir a grade repetitiva por gasto líquido em destaque, comparação válida e maior categoria; abrir no mês mais recente com registros.
- [ ] Construir ranking de categorias com valores/participação apropriados e controles equivalentes ao clique. Representar negativos sem esconder seu sinal. Oferecer valores em lista/tabela; clique e controle por teclado abrem exatamente o mesmo recorte, sem informação essencial restrita ao tooltip.
- [ ] Exibir evolução diária no mês e mensal no histórico, com lacunas, eixos/tooltips legíveis e sem uma barra gigante para o único mês.
- [ ] Entregar os detalhes previstos: estatísticas completas, histograma, rosca quando válida, rankings por frequência/valor, maiores despesas e recorrências.
- [ ] Incluir observação determinística curta ligada a uma ação real. Não prometer economia nem atribuir à IA uma análise local.
- [ ] Remover o filtro local sobre a lista truncada. A investigação usa a rota de Transações e os filtros completos no servidor.

**Concluir quando:** os gráficos respondem às perguntas da entrevista e os números conferem com a API; após P09, clique e teclado abrem o conjunto correto. Usar V3/V5/V6. Commit: `Entrega painel Categorias em foco com analises completas`.

### P09 — Implementar a investigação de transações

**Responsável:** interface; principal integra rota e chamadas. **Depende de:** P05–P07. **Aceites:** A02, A08, A16.

**Arquivos:** `components/panel/TransactionsSection.tsx` e seus componentes de filtros/detalhe (**novos**), `pages/PanelPage.tsx`, `panel/api.ts` e estilos internos.

- [ ] Entregar primeiro listagem/filtros/paginação, depois detalhe e indicação de origem/duplicidade.
- [ ] Preservar filtros na URL, reiniciar a página ao trocar filtro e distinguir vazio inicial de busca sem resultado.
- [ ] Mostrar o total do filtro e o que compõe o gasto, sem somar valores da página no React.
- [ ] Garantir que uma resposta de busca anterior não substitua a mais recente; oferecer limpar filtros e repetir requisição que falhou.

**Concluir quando:** navegar do gráfico, paginar, recarregar e voltar mantém o recorte; item posterior ao 300º é acessível. Usar V3/V5/V6. Commit: `Conclui tela de pesquisa e detalhe de transacoes`.

### P10 — Concluir correção de categoria e regra pessoal

**Responsável:** backend + interface, com arquivos distintos. **Depende de:** P03–P06 e P09. **Aceites:** A09, A15, A16.

**Arquivos:** serviços/repositórios/schemas de transações, `api/transactions.py`, `repositories/category_rules.py` e `services/categories.py` (**novos se necessários**), categorização do pipeline, componentes de Transações e testes de categorias/regras.

- [ ] Implementar `PATCH /api/transactions/{id}/category` com validação de propriedade/categoria e confirmação pela API.
- [ ] Permitir salvar regra para importações futuras do estabelecimento normalizado; respeitar a precedência e não recategorizar o histórico.
- [ ] Ao confirmar a correção, atualizar as consultas afetadas e a identidade dos dados usada por futuro diagnóstico. A mudança e suas consequências no banco são atômicas.
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

**Responsável:** interface; principal integra shell/DTOs. **Depende de:** P07 e P11. **Aceites:** A10, A11, A16.

**Arquivos:** `components/panel/LimitsSection.tsx`, `NotificationsMenu.tsx` (**novos**), `PanelPage.tsx`, cliente API e estilos internos.

- [ ] Entregar criação/alteração/remoção do limite, situação por mês e categorias sem limite.
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
- [ ] Recomendar exemplos, explicar retenção das transações e confirmar exclusão dentro do produto; atualizar análises após excluir.

**Concluir quando:** uma pessoa consegue começar com um exemplo, conferir qualidade e excluir o envio; todos os links de material funcionam. Usar V2/V3/V6. Commit: `Finaliza Arquivos e exemplos da primeira versao`.

### P14 — Concluir exclusão de conta

**Responsável:** backend + interface. **Depende de:** P07; teste final inclui entidades de P11/P15. **Aceites:** A14, A15, A16.

**Arquivos:** `api/auth.py`, `services/auth.py`, `repositories/users.py`, `AccountSection.tsx`, `auth/api.ts`/contexto quando necessário, testes de autenticação/exclusão.

- [ ] Implementar `DELETE /api/auth/me` com remoção atômica dos dependentes, revogação das sessões e encerramento do cookie.
- [ ] Apresentar nome/e-mail e confirmação explícita no produto; erro mantém a conta como ativa e permite nova tentativa.
- [ ] Testar com dois usuários e, após P15, com uploads/regras/limites/avisos/diagnósticos/tentativas preenchidos. Não excluir dados da outra conta.

**Concluir quando:** todos os dados próprios saem, sessões antigas deixam de valer e a interface retorna à página pública. Usar V2/V3/V6. Commit: `Conclui exclusao atomica da propria conta`.

### P15 — Implementar diagnóstico, reservas e adaptador de IA

**Responsável:** backend; dados revisa payload e principal integra revisão `0004`. **Depende de:** P06, P10 e P11. **Aceites:** A12, A13, A15, A17.

**Arquivos:** revisão `0004_monthly_insights`, entidades/exportações; módulos em `backend/app/ai/`, `services/insights.py`, `repositories/insights.py`, `api/insights.py`, `schemas/insights.py`, configuração de ambiente e dependências; `tests/test_insights.py` (**novos**).

- [ ] Persistir um diagnóstico por usuário/mês com payload validado, identificação da base, modelo/versão e data. Acrescentar registro de tentativas/reservas no PostgreSQL; isso não exige fila ou cache externo.
- [ ] Montar somente agregados permitidos, referências de métricas e maiores valores sem descrições brutas/lista individual. Validar esquema e referências em Pydantic; o modelo não executa SQL.
- [ ] Reservar tentativa diária e uma execução por usuário/mês em transação curta. Contar reservas concorrentes no teto de três; falha comprovadamente pré-envio libera reserva, envio incerto consome.
- [ ] Usar lease com expiração, identificador da geração e base para rejeitar respostas antigas. Expirar execução não devolve tentativa enviada; mudança da base impede publicar o resultado como atual.
- [ ] Integrar um adaptador Groq configurável, timeout explícito e retries do SDK desativados. Conferir documentação vigente antes de fixar versão de SDK/modelo. Sem credencial/cota Free confirmada, devolver indisponibilidade; não contratar nem usar fallback pago.
- [ ] Cobrir com cliente falso: sucesso, resposta inválida/referência inventada, sem despesas, cota diária, concorrência, expiração, timeout, resposta tardia, mudança da base e preservação do último diagnóstico válido. Verificar desatualização após upload, exclusão/promoção de cópia, correção de categoria e alteração/remoção de limite, inclusive na leitura do diagnóstico salvo.
- [ ] Depois dos testes locais, validar uma geração real com dados fictícios em cota gratuita confirmada, sem imprimir chave ou payload sensível. Registrar apenas evidência suficiente do resultado.

**Concluir quando:** API/estado persistido e limites passam nos testes; A13 exige a geração real gratuita. Ausência de cota fica identificada como bloqueio, sem declarar a v1 completa. Usar V2/V4 e V7. Commit: `Implementa diagnostico mensal com uso gratuito controlado`.

### P16 — Integrar o diagnóstico ao painel

**Responsável:** interface; principal integra DTOs. **Depende de:** P08 e P15. **Aceites:** A12, A13, A16.

**Arquivos:** `components/panel/MonthlyDiagnosis.tsx` (**novo**), detalhes do painel, cliente API e estilos internos.

- [ ] Mostrar diagnóstico salvo, data e contexto; avisar sobre envio dos agregados antes de gerar.
- [ ] Oferecer geração/regeneração com prevenção de duplo envio e estado de processamento.
- [ ] Distinguir ausência de despesas, configuração ausente, cota atingida, erro e diagnóstico desatualizado. Não apagar o último válido em caso de erro.
- [ ] Apresentar referências e ações de revisão sem números inventados ou promessa de economia.

**Concluir quando:** geração, consulta e falhas ficam claras e o resto do painel permanece utilizável. Usar V3/V6; integração real somente em V7. Commit: `Integra diagnostico mensal ao painel interno`.

### P17 — Retirar estruturas legadas com evolução validada

**Responsável:** principal; revisão de backend. **Depende de:** P03, P06, P10–P16 quanto a código/esquema testados e rastreabilidade preservada; não espera cota ou geração real de IA. **Aceites:** A14, A15, A17.

**Arquivos:** revisão `0005_remove_legacy`, entidades/exportações, repositórios de upload, testes de migração/integridade/códigos e docs do banco.

- [ ] Inventariar referências a bronze/mapping/storage/status legado. Transferir metadados comprováveis antes da retirada; não apagar informação financeira para simplificar migração.
- [ ] Validar uma cópia sintética representativa do esquema antigo e interromper a migração com erro explicativo se houver conteúdo que não possa ser preservado conforme o desenho.
- [ ] Retirar consumidores de execução e depois estruturas aprovadas. Manter scripts/revisões históricas imutáveis e testes específicos da baseline separados do esquema final.
- [ ] Testar `0001 → head`, instalação limpa, dados/UUIDs/códigos/relações e comparação de modelos com o esquema final. Não alegar downgrade sem perda quando a reversão não puder reconstruir dados removidos.

**Concluir quando:** `alembic check` fica limpo no banco descartável final e as regras da v1 não dependem de estruturas antigas. Usar V2/V4. Commit: `Alinha esquema final a arquitetura documentada`.

### P18 — Preparar execução e versão de apresentação

**Responsável:** principal; backend revisa configuração. **Depende de:** funcionalidades integradas e P17. **Aceites:** A18.

**Arquivos:** `Dockerfile`, `compose.yaml`, `.dockerignore` (**novos**), configuração do backend para servir o build React, exemplos de ambiente sem segredos e READMEs.

- [ ] Preparar build React servido pelo FastAPI e PostgreSQL no Compose, preservando mesma origem e deep links de `/app/...`; não adicionar Nginx.
- [ ] Separar execução das migrações da inicialização da API. Usar comando explícito no ambiente descartável/local; não rodar upgrade silencioso no startup.
- [ ] Validar tanto instalação nova quanto evolução de banco com dados. Na disponibilização sobre banco existente, usar uma janela sem escrita: preservar cópia de segurança, aplicar somente migrações já testadas e iniciar a versão correspondente após conferir o esquema. Não expor código que exija revisão ainda não aplicada nem prometer reversão sem perda para a retirada de legados.
- [ ] Documentar inicialização, persistência, migração, variáveis e verificação de saúde. Confirmar ferramentas do ambiente antes de fornecer o comando operacional definitivo.
- [ ] Preparar destino gratuito de apresentação e validar compatibilidade com PostgreSQL/extensões e cookie HTTPS. Publicação é uma ação final sobre uma versão testada, usando a autorização existente ou solicitando-a quando o destino ainda não estiver autorizado.
- [ ] Validar na versão hospedada login, upload, filtros e persistência após reinício; não transportar credenciais de teste para o frontend.

**Concluir quando:** o fluxo local documentado funciona e existe evidência do fluxo hospedado; se faltar destino/acesso, registrar exatamente essa parte pendente. Usar V8.

### P19 — Verificar a experiência completa, atualizar documentação e ensaiar

**Responsável:** principal com revisão cruzada dos três especialistas. **Depende de:** fluxos locais integrados de P08–P17 para iniciar; publicação/ensaio de P18 e A13 para aceite integral. **Aceites:** A01–A19.

**Arquivos:** `scripts/frontend/check_panel_flow.py` (**novo, seguindo os scripts existentes**), scripts de experiência/autenticação/acessibilidade já presentes, `scripts/frontend/README.md`, READMEs do projeto, `PRODUCT.md`, `DESIGN.md`, docs de arquitetura/análise/banco/planejamento e `docs/roteiro-banca-v1.md` (**novo**).

- [ ] Criar verificação integrada real das abas com fixtures em servidor e banco descartáveis conhecidos. Separar esse percurso dos scripts atuais da demonstração pública; não transformar a demo fictícia em um teste dependente de conta real.
- [ ] Percorrer cadastro/login → exemplo → qualidade → painel → categoria → transações → correção → limite → aviso/leitura → diagnóstico → exclusões/logout.
- [ ] Conferir atualização dos dados após cada mutação: buscar novamente os resultados da API para painel, transações, limites e avisos afetados, sem introduzir cálculo local ou cache global. Diagnóstico conserva data/contexto e sinaliza quando sua base mudou.
- [ ] Conferir visual em 320/768/1280/1920 px, teclado, foco, movimento reduzido e zoom real de 200%. Zoom real exige conferência do navegador; `device_scale_factor` ou transformação CSS não substituem a verificação.
- [ ] Executar a suíte completa uma vez após a última integração, o build e os fluxos afetados. Repetir depois disso somente se nova mudança/falha justificar.
- [ ] Atualizar estados documentais com evidências, alinhar `/app/files`, registrar configuração gratuita e preparar roteiro curto com dados fictícios e números reconciliáveis.
- [ ] Ensaiar tanto navegação em projetor quanto leitura no celular, inclusive sem IA disponível; esse ensaio alternativo não substitui A13 para declarar conclusão integral.
- [ ] Entregar tabela final A01–A19 com comando/evidência, resultado e limitação real, distinguindo validado, parcial e bloqueado.

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
| V6 | Novo percurso interno com Playwright/API real em ambiente descartável, sem custo de IA nos testes automatizados |
| V7 | Validação real controlada do diagnóstico em conta/cota gratuita, após sucesso do cliente falso; repetir somente se falha ou nova mudança justificar |
| V8 | Smoke test Compose e hospedagem, mesma origem, sessão/upload/persistência |

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
.\.venv\Scripts\python.exe -m pytest -o pythonpath=backend -o cache_dir=.impeccable/pytest-cache-v1 backend/tests/test_transactions.py backend/tests/test_analytics.py -q
npm --prefix frontend run build
```

Os testes de banco reutilizam `postgres_cluster`/`auth_client` ou fixtures equivalentes do mesmo arquivo; nunca usam o banco do `.env`. Adaptar o helper Alembic para receber conexão e revisão, mantendo o padrão atual. A verificação de migrations não deve chamar `alembic upgrade head` contra o ambiente de uso por conveniência.

Scripts atuais da interface usam `GERENCIA_TEST_URL`, `.audit-tools/` e `.audit-tools-js/` conforme seu README. Executar scripts mutantes de acesso/painel somente contra API iniciada com banco temporário confirmado pelo executor e URL definida explicitamente. Interromper se a origem/banco não puderem ser identificados; não usar a URL padrão como autorização para criar contas ou excluir dados.

Capturas e relatórios de execução ficam em `.impeccable/review/`, ignorados pelo Git; manter no repositório somente scripts e relato de evidência sem dados pessoais. Não criar uma nova infraestrutura de testes nem testes unitários de frontend.

## 5. Dependências, prazo e tratamento de impedimentos

Linha principal: **P00 → P01/P02 → P04 → conclusão de P03 → P05 → P06 → P08/P09 → P10 → P11 → P12/P15 → P16 → P17 → P18/P19**. P03 começa pela deduplicação pura/persistência depois de P01/P02, mas conclui a reconciliação usando P04; não há dependência inversa de P04 para P03.

P07 pode começar após P00 com dados sintéticos identificados, mas só é aceito com integração real. P13 depende de P03/P07; P14 pode ser preparado após P07 e concluído depois das entidades dependentes. Não adiar Arquivos/Conta até o fim se houver uma frente livre. A implementação pura e os testes falsos da IA podem avançar depois de P06, antes de limites estarem integrados, mas seu aceite depende de P11. Sem cota real, o código validado com cliente falso pode ser integrado a P16/P17, e P19 local continua; somente A13 e o aceite integral da v1 aguardam essa verificação externa.

Meta operacional de referência: obter a primeira candidata integrada antes da última semana de novembro e reservar essa semana para publicação validada, correções e ensaio. Isso é uma meta de organização, não uma estimativa de esforço já comprovada. O dia da banca não foi informado; não assumir que haverá tempo até o último dia do mês.

Reavaliar progresso ao concluir P06 e P12. Se houver risco de prazo, informar tarefas e aceites ainda pendentes e ajustar a ordem do trabalho independente. Não cortar estatísticas, qualidade, isolamento ou funcionalidades obrigatórias sem acordo explícito.

Impedimentos externos conhecidos e sua consequência:

- Sem cota/chave gratuita de IA: concluir cliente falso e interface de indisponibilidade; manter A13 pendente. Não solicitar chave pelo chat nem contratar plano.
- Sem Docker ou acesso ao destino de hospedagem: deixar configuração/documentação revisáveis e identificar qual teste operacional ainda falta; não declarar A18 validado.
- Dados históricos sem evidência recuperável: preservar registros e explicar a limitação. Interromper apenas a conversão que dependeria de adivinhação, não o restante do trabalho independente.

## 6. Revisão e escolha da execução

Recomendação: **execução coordenada nesta conversa, com os três especialistas e integração pelo principal, por lotes verificáveis**. Cada lote termina com revisão cruzada, testes proporcionais e commit local; não exige nova aprovação para cada edição rotineira já autorizada pelo plano.

Alternativa: execução sequencial pelo principal usando o mesmo plano e os especialistas apenas na revisão. Reduz a coordenação de arquivos, mas aproveita menos o paralelismo solicitado.

Após revisar este documento, o usuário escolhe executar com especialistas, executar sequencialmente ou solicitar ajustes. A escolha autoriza o trabalho local descrito, sem transformar este plano em evidência de implementação, migração aplicada ou publicação já feita.
