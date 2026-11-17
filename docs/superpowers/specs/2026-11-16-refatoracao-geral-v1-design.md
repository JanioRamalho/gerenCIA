# gerenCIA — nova interface interna e simplificação da primeira versão

Data: 16 de novembro de 2026. Branch: `Janio`. Base examinada: `0fc5899`.

**Atualização de 17/11:** a [instrução de escopo sem IA](2026-11-17-escopo-sem-ia.md) prevalece sobre as partes de diagnóstico e integrações deste documento. A entrega atual não inclui IA; hospedagem prevista na Vercel e limite de arquivo ajustado para 4 MB.

Estado: **especificação escrita aprovada pelo usuário em 16/11/2026**, a partir do documento registrado em `72d6488`. A aprovação autoriza preparar o plano de execução; não declara implementação, migração aplicada ou publicação. A entrega tem prazo de **27 de novembro de 2026**; a data da banca não foi informada.

## 1. Resultado e decisões da entrevista

Renovar a área interna para que a pessoa compreenda onde gastou, compare períodos e investigue despesas sem uma tela carregada de blocos repetidos. Concluir as funções pendentes da primeira versão e simplificar o código, mantendo um projeto acadêmico que o autor consiga compreender e explicar.

| Decisão confirmada | Aplicação |
| --- | --- |
| Área interna primeiro | Painel, Arquivos, Transações, Limites e Conta; avaliar as telas públicas posteriormente |
| Concluir a primeira versão | Implementar também as funções documentadas ainda pendentes |
| Categorias em destaque | Distribuição dos gastos como centro do Painel, comparação ao lado e detalhes abaixo |
| Dois meses escolhidos | Comparar total e categorias entre quaisquer dois meses disponíveis, com identificação explícita |
| Petróleo e menta, tema claro | Nova composição livre do layout atual, preservando nome e símbolo |
| Categorias com cores e ícones | Identificação consistente entre gráfico, lista, transações e limites |
| Recorrências resumidas no Painel | Serviços, valores e gráfico; detalhes por ação da pessoa |
| Lançamentos recentes no Painel | Lista completa, busca e filtros em Transações |
| Direção proposta pelos agentes | Não há nova referência externa escolhida pelo usuário |
| Código simples e enxuto | Eliminar duplicação, código sem uso e complexidade desnecessária, preservando legibilidade e comportamento |
| Colaboração com agentes | Responsabilidades distintas e integração pelo principal, sem edições concorrentes no mesmo arquivo |

## 2. Fontes e precedência

Este documento complementa a [especificação financeira e funcional anterior](2026-11-16-renovacao-interna-v1-design.md). Permanecem válidas suas seções 3, 5–9 e os aceites A01–A19, **com as alterações explícitas deste documento**, principalmente comparação, composição do Painel e cores das categorias.

O [planejamento acadêmico](../../planejamento-gerencia.txt), a [arquitetura](../../arquitetura.md), a [análise de dados](../../analise-de-dados.md) e o [guia do banco](../../database-setup.md) continuam definindo o núcleo do produto. As escolhas desta entrevista prevalecem sobre as antigas decisões de layout em `PRODUCT.md`, `DESIGN.md` e na especificação anterior. Textos antigos de estado não comprovam o estado atual do código.

O [plano de execução](../plans/2026-11-16-renovacao-interna-v1.md) incorpora esta entrevista e continua sujeito à revisão e escolha da execução pelo usuário. Suas versões anteriores permanecem no Git. Não executar a comparação antiga como substituta da seleção de dois meses.

## 3. Estado observado e escopo

Sessões, upload/histórico/exclusão de arquivos e análises persistidas já têm implementação. Transações e Limites ainda aparecem desativados no menu; Conta ainda anuncia exclusão como futura. Qualidade, semântica financeira, estatísticas completas, avisos e diagnóstico exigem conclusão ou adequação. As verificações históricas não validam antecipadamente esta refatoração.

Entram no trabalho: importação e qualidade, estatística descritiva, comparações, transações e correção de categoria, regras pessoais, limites mensais, sininho, recorrências, diagnóstico mensal, exclusões, exemplos fictícios, execução e preparação da apresentação.

Página pública, demonstração para visitantes, login e cadastro ficam fora do redesenho inicial. Continuam funcionando e recebem apenas ajustes compartilhados e verificações de regressão necessários. Nenhuma estatística obrigatória será retirada por ficar fora da primeira tela.

## 4. Interface proposta

### 4.1 Linguagem comum

Reutilizar a fonte local **Inter Tight**, com valores tabulares, hierarquia clara e texto de apoio legível. Navegação compacta em petróleo; superfícies de leitura claras; menta nas ações e seleções. A identidade vem da distribuição dos gastos e de seus símbolos, sem depender de gradientes decorativos ou de um cartão para cada informação.

Paleta-base: petróleo `#0b2a33`, tinta `#0f3440`, menta `#a7e5d6`, fundo claro `#eef4f1`, branco `#ffffff` e apoio `#45656b`. Reutilizar tokens existentes e limitar novos estilos à área interna quando possível, evitando alterar a página pública por efeito de seletores globais.

Criar um único mapa visual para as onze categorias existentes, sem alterar sua identidade financeira. Direção inicial: Alimentação em laranja com utensílios; Transporte em azul com veículo; Saúde em rosa com símbolo de saúde; Assinaturas em violeta com cobrança recorrente. Completar o mapa das demais categorias com o mesmo conjunto de ícones e um fallback para categorias desconhecidas. Estender o componente SVG existente quando adequado; não adicionar uma biblioteca só para poucos ícones.

Cores de categorias não substituem cores semânticas de erro, atenção ou sucesso. Nome, ícone e valor sempre acompanham a cor. A paleta final passa por conferência de contraste e leitura no protótipo.

### 4.2 Painel

Ordem de leitura proposta:

1. Contexto do período, acesso a Arquivos e notificações; abrir no mês mais recente com transações e oferecer todos os meses.
2. Gasto líquido em destaque, com poucas informações de apoio. Explicações técnicas do processamento ficam na documentação e nos detalhes de qualidade.
3. Bloco principal de categorias, em ranking horizontal com ícone, nome, valor e participação quando válida. Ao lado, comparação com outro mês escolhido. No celular, categorias vêm antes da comparação.
4. Evolução dos gastos: diária no mês escolhido e mensal na visão histórica. Evitar uma barra gigante quando existe só um mês.
5. Resumo de assinaturas e recorrências, com gráfico por serviço e acesso aos detalhes.
6. Até cinco lançamentos recentes, com acesso à lista completa em Transações.
7. Acesso a estatísticas, distribuição, estabelecimentos, maiores despesas, movimentos de entrada/pagamento e diagnóstico, organizados em detalhes sem esconder sua existência.

O gráfico de categorias continua dando acesso a todos os grupos; não recortar categorias para caber na tela. Com muitas categorias, expandir a área ou permitir ver o conjunto completo. Clique e ação por teclado levam às transações do período e categoria correspondentes.

O conteúdo usa a largura disponível com limite de leitura coerente. Evitar cartões aninhados, uma faixa larga vazia à direita ou gráficos apertados. A lista recente não cria uma segunda tabela completa no Painel.

### 4.3 Outras abas

| Aba | Comportamento esperado |
| --- | --- |
| Arquivos | Envio, modelos/exemplos, histórico, qualidade e rejeições; exclusão com confirmação no produto |
| Transações | Pesquisa, filtros antes da paginação, agregados do conjunto completo, natureza/origem e correção de categoria com regra pessoal opcional |
| Limites | Configuração mensal por categoria, utilizado/restante e excesso explícito; avisos no sininho |
| Conta | Nome, e-mail, contexto de privacidade e exclusão efetiva da própria conta e dependentes |

Manter as regras detalhadas dessas operações nas seções 6–9 da especificação anterior. Não adicionar uma sexta aba de Assinaturas: os detalhes pertencem ao Painel, conforme a entrevista.

### 4.4 Estados e acessibilidade

Cada fluxo distingue carregamento, vazio, filtro sem resultado, indisponibilidade de medida, validação e erro de servidor. Falha não vira zero ou dado fictício. Formulários conservam a edição após erro; mudanças só são anunciadas como concluídas após confirmação da API.

Todos os gráficos interativos usam Recharts e têm valores e ações equivalentes acessíveis sem tooltip. Navegação por teclado, foco visível, menu móvel com Escape e retorno do foco, alvos de toque de 44 px e movimento reduzido. Validar 320, 768, 1280 e 1920 px e zoom real de 200%; somente tabelas identificadas podem exigir rolagem horizontal.

## 5. Comparação entre meses

Esta seção substitui a obrigação de usar apenas o mês anterior como comparação principal do Painel. **Agosto e outubro podem ser comparados quando escolhidos explicitamente**, sem apresentar agosto como setembro ou como mês anterior do calendário.

- A seleção contém mês analisado e mês de referência distintos, identificados por mês e ano. Ambos precisam ter registros disponíveis do próprio usuário. No início, o mês analisado é o mais recente; a referência é o mês anterior do calendário quando disponível, ou fica sem seleção com orientação para escolher outro. Não substituir automaticamente um mês ausente.
- Comparar gasto líquido total e categorias. Diferença em reais = analisado menos referência; percentual = diferença dividida pela referência somente quando ela for positiva. Base zero ou negativa mantém a diferença absoluta e informa indisponibilidade percentual.
- Uma categoria sem movimento em um mês com registros pode contribuir com zero nos dados importados. Um mês inteiro sem registros não comprova gasto zero.
- Exibir as categorias presentes em qualquer um dos meses, mantendo o mesmo ícone e cor. Redução de gasto não é automaticamente economia comprovada; informar meses em andamento e cobertura observada.
- Todos os meses é uma visão agregada, sem comparação mensal direta. A pessoa escolhe um mês específico para comparar.
- O serviço de análise resolve períodos e calcula as duas bases, totais, diferenças, percentuais e motivos de indisponibilidade; o React só apresenta. A API retorna períodos explícitos e os mesmos identificadores de categorias usados nos links de investigação.
- Persistir seleção e filtros na URL. Uma resposta antiga não pode sobrescrever uma seleção mais recente.
- O diagnóstico mensal e qualquer indicador chamado mês anterior continuam usando o mês anterior **do calendário**. A seleção livre do Painel não altera silenciosamente a base de um diagnóstico salvo.

## 6. Assinaturas e recorrências

Manter a detecção documental: recorrência confirmada exige mesmo estabelecimento e valor em todos os meses com registros do histórico, com pelo menos dois meses, sem parcelas nem duplicatas confirmadas. Serviço reconhecido pelo nome em um só mês é assinatura identificada, não recorrência confirmada. Lacunas no calendário continuam explícitas.

O resumo lista serviços e valores observados no período consultado e usa barras horizontais por serviço. Detalhes exibem a classificação, última cobrança observada, meses usados como evidência e valor mensal/anualizado quando houver uma base mensal identificável. A detecção consulta o histórico completo; a apresentação informa esse contexto e distingue-o do período dos valores exibidos. Todos os meses mostra gasto observado no intervalo completo, sem rotulá-lo como mensal.

Nos detalhes, a base mensal de cada serviço é o gasto no mês mais recente em que há transações elegíveis desse serviço no histórico, identificado por mês e ano. A estimativa anual é essa base multiplicada por doze; não anualizar o agregado histórico nem recalcular a base apenas porque a pessoa mudou o filtro. Distinguir essa estimativa do gasto efetivamente observado no período selecionado, inclusive quando não há cobrança do serviço naquele período.

Um serviço pode receber as duas classificações, mas suas transações não entram duas vezes no gráfico ou total. Os valores vêm de um conjunto único de transações elegíveis calculado no backend, seguindo a mesma semântica financeira. Estornos só recebem vínculo com serviço quando há evidência; não inventar associação aproximada.

Sem dados suficientes, informar o motivo e orientar a importação de outro mês. Não criar datas futuras de cobrança, previsão ou calendário. Anualização é extrapolação identificada de doze meses, sem promessa de valor futuro.

## 7. Simplificação do código e páginas

Manter React/TypeScript/Vite/Recharts e FastAPI/pandas/SQLAlchemy/Pydantic/OpenPyXL/PostgreSQL/Alembic. Fluxo de backend: rota → serviço → repositório → banco; funções de tratamento independentes de HTTP e banco. Reutilizar funções de período, elegibilidade e análise em painel, limites e IA.

| Candidato confirmado no levantamento | Ação proposta e condição |
| --- | --- |
| Clientes HTTP semelhantes em `auth/api.ts` e `panel/api.ts` | Compartilhar transporte e erro, preservando JSON, corpo de upload, headers, cookie, erros de campo, 204 e sessão expirada |
| Formatação de moeda/percentual repetida | Uma implementação compartilhada de apresentação; não mover cálculo financeiro para o navegador |
| Gráficos e tabelas semelhantes entre demo, teste e painel | Compartilhar só apresentação com contrato realmente comum; manter dados fictícios da demo separados dos dados pessoais |
| `/teste-analise` e `AnalysisTestPage.tsx` | Retirar a página de teste da entrega final quando o fluxo autenticado a substituir e os consumidores forem verificados; remover somente estilos, imports e endpoints comprovadamente exclusivos dela |
| `get_with_quality` aparentemente sem consumidor | Conferir chamadas, testes e uso antes de excluir; busca inicial não é prova suficiente |
| Estruturas antigas de Medallion/mapeamento | Evoluir por migração testada após preservar dados e origem; não apagar tabelas como simples limpeza de código |

Não perseguir limite arbitrário de linhas, minificar fontes, unir responsabilidades para reduzir arquivos ou criar abstrações genéricas sem reuso. Medir a melhora por duplicação retirada, caminhos de execução simplificados, clareza e verificações preservadas. Anotar arquivos/linhas antes e depois como evidência auxiliar, não como meta numérica.

`PanelHome` e `PanelOverview` representam estados do Painel, não páginas duplicadas comprovadas. A demonstração pública continua disponível; não removê-la por semelhança com o painel real. Scripts históricos e migrações anteriores permanecem quando necessários à rastreabilidade e evolução.

## 8. Regras e dados preservados

Continuam válidos: gasto líquido = compras + tarifas − estornos; receitas e pagamentos separados; valores monetários exatos e novos DTOs em texto decimal; deduplicação com evidência; rastreabilidade; isolamento por sessão; estatísticas completas; qualidade em quatro dimensões; uploads atômicos; limites mensais; unicidade dos avisos; confirmação das exclusões no produto.

Diagnóstico continua sob ação explícita, só com agregados permitidos e custo zero confirmado, com validação da resposta, persistência, indicação de desatualização e limites de tentativas/concorrência da especificação anterior. Não mudar provedor/modelo por este documento nem tomar menções antigas a ofertas gratuitas como disponibilidade atual: verificar documentação e conta antes da integração real.

Não adicionar chat, previsão de cobranças, limites semanais, mapeador genérico, armazenamento dos originais, filas ou infraestrutura fora do escopo acadêmico. Mudanças de esquema usam novas revisões Alembic, mantendo a revisão inicial intacta e dados históricos sem inferências inventadas.

## 9. Entregas, agentes e recuperação

A execução deve ter duas frentes explícitas: experiência visual e simplificação do código, com apoio de dados/backend para concluir as funções reais. As entregas são integradas por lotes verificáveis: contratos e base financeira; protótipo com dados fictícios identificados; Painel e Transações; limites/avisos; Arquivos/Conta/diagnóstico; limpeza final, execução e ensaio. Dependências permitem antecipar Arquivos, Conta e apresentação quando seguro.

Até três especialistas e o principal podem trabalhar em paralelo, com um editor por arquivo. O principal coordena contratos, modelos, migrações, rotas e integração. Revisões precisam conferir tanto comportamento quanto duplicação ou complexidade introduzida. Aplicar UI/UX Pro Max e frontend-design à experiência; manter a simplicidade acadêmica na implementação.

Trabalhar na branch `Janio`, com commits locais pequenos e descritivos. Antes do primeiro lote de produto, registrar o commit de partida e o estado limpo. A `main` permanece intacta; ela não substitui os pontos de recuperação da própria `Janio`, pois pode não conter os mesmos avanços. Não fazer push, merge ou publicação durante a preparação desta especificação.

Validar banco e migrações em PostgreSQL descartável; não aplicar mudanças no banco de uso para testar. Commits recuperam código, mas não desfazem alterações de banco: preservar cópia de segurança e usar a disciplina operacional da especificação anterior antes de qualquer evolução em ambiente de uso.

O plano deve reservar um lote final de correções, regressão e ensaio antes de 27/11, sem prometer conclusão de integrações externas ainda não confirmadas. Falta de cota gratuita de IA ou hospedagem validada deve aparecer como pendência concreta, sem impedir o avanço local independente e sem declarar aceite integral.

## 10. Aceites adicionais e revisão

Permanecem A01–A19 da especificação anterior. **A03 passa a exigir:** comparação livre respeita os dois meses explicitamente selecionados; comparação chamada mês anterior não substitui mês ausente; bases zero/negativas e meses parciais têm tratamento explícito.

| ID | Evidência de conclusão |
| --- | --- |
| R01 | Cinco abas internas utilizáveis e visualmente consistentes, com tema claro e categorias identificadas por cor, ícone e nome |
| R02 | Agosto e outubro selecionados comparam total/categorias corretamente; base indisponível não gera porcentagem; trocar filtros não mostra resultado antigo |
| R03 | Recorrências mostram serviços, valores e gráfico, com detalhes acessíveis e sem dupla contagem entre classificações |
| R04 | Painel mostra até cinco lançamentos recentes; lista completa paginada e investigação filtrada funcionam em Transações |
| R05 | Remoções têm consumidores verificados; transporte/formatação compartilhados preservam acesso e upload; página pública e autenticação continuam funcionais |
| R06 | Regras financeiras, migrações e autorização passam nas verificações apropriadas; build e percurso real das abas têm evidência |
| R07 | Documentação descreve recursos e pendências reais; commits permitem recuperar etapas de código; demonstração usa exemplos fictícios reconciliáveis |

Usar pytest para cálculos e regras alteradas, casos pequenos conferidos à mão, banco descartável e dois usuários para autorização. Usar build TypeScript/Vite e scripts Playwright existentes para o percurso, teclado e regressões compartilhadas. Não criar nova infraestrutura de testes ou testes que apenas repitam o código. Não executar chamadas reais de IA durante revisão documental.

Revisão documental: os agentes de experiência e código fizeram leituras independentes do repositório e desta especificação. A revisão encontrou e resolveu a ambiguidade da base de anualização de serviços. Links locais foram conferidos; não foram executados testes de produto nesta etapa.

Com a revisão escrita aprovada, o próximo entregável é o plano atualizado, com tarefas verificáveis e divisão dos agentes, para revisão e escolha da execução. Até essa escolha, não iniciar código de produto ou protótipo.
