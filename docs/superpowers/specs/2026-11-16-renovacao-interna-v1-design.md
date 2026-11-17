# gerenCIA — renovação interna e conclusão da primeira versão

Data: 16 de novembro de 2026. Branch de referência: `Janio`, base `5cd9849`.

Estado: **especificação aprovada pelo usuário em 16/11/2026**, a partir do conteúdo registrado em `56d69a8`. Este documento registra o desenho aprovado. Não é um plano de execução nem declara os recursos abaixo como implementados.

Atualização: a nova entrevista está consolidada na [especificação de interface e simplificação](2026-11-16-refatoracao-geral-v1-design.md), aprovada pelo usuário em 16/11/2026 a partir de `72d6488`. Ela registra prazo de 27/11, cores/ícones de categorias, comparação livre entre dois meses e a nova organização do Painel. Suas alterações explícitas prevalecem; os demais contratos deste documento permanecem como referência.

Leitura sugerida: seções 1 e 4 para objetivo e visual; seção 6 para as abas; seções 7 e 12 para as decisões técnicas propostas. As demais seções registram regras e critérios para orientar implementação e revisão.

## 1. Resultado esperado e decisões da entrevista

Concluir a primeira versão para a banca, com entrega na **última semana de novembro de 2026**, dentro do escopo já documentado. O dia exato da apresentação não foi fixado na entrevista; o planejamento de execução deverá reservar espaço para validação e ensaio, sem reduzir os critérios de aceite silenciosamente.

Ao abrir o painel, a pessoa deve entender **quanto gastou, onde concentrou os gastos e quais despesas pode revisar para economizar**. A dor relatada foi um visual simples e genérico e a percepção de que o produto poderia ser mais útil e simples de usar.

| Decisão do usuário | Consequência no produto |
| --- | --- |
| Composição **Categorias em foco** | Categorias são a principal visualização e levam aos lançamentos que explicam o total. |
| Densidade equilibrada | Poucos indicadores na primeira leitura; estatísticas completas e explorações acessíveis nos detalhes. |
| Visual marcante e sóbrio | Números grandes, contraste petróleo/menta, hierarquia forte e menos cartões repetidos. |
| Renovar todas as abas internas | Painel, Arquivos, Transações, Limites e Conta usam a mesma linguagem visual. |
| Aproveitar a página pública e as telas de acesso | Preservar sua composição; verificar somente integração e regressões necessárias. |
| Nenhum gasto com API de IA | Diagnóstico sob demanda, condicionado à cota gratuita e sem contratação ou troca automática para plano pago. |
| Código funcional, simples e fiel à documentação | Entregas incrementais, mudanças localizadas e manutenção da arquitetura existente. |

A alternativa de reformular toda a aplicação de uma vez foi descartada na proposta aprovada por ampliar a superfície de regressão e dificultar a conclusão no prazo. A renovação será integrada aos fluxos reais, com valores conferíveis a cada entrega.

## 2. Fontes, precedência e estado observado

Esta especificação detalha a proposta aprovada e deve ser lida junto destas fontes:

- [Planejamento da primeira versão](../../planejamento-gerencia.txt), especialmente seções 4–13, 15–16 e 18.
- [Arquitetura](../../arquitetura.md) e [análise de dados](../../analise-de-dados.md).
- [Identidade e componentes existentes](../../../DESIGN.md) e [propósito do produto](../../../PRODUCT.md).
- [Operação do banco e Alembic](../../database-setup.md).

As escolhas recentes da entrevista prevalecem sobre a composição antiga das telas internas. Os requisitos financeiros e o escopo da primeira versão continuam os do planejamento. Mover uma estatística para os detalhes não elimina sua entrega. Não se deve interpretar textos antigos de estado em README, PRODUCT ou DESIGN como prova de implementação atual.

| Capacidade | Situação na base examinada | Evidência principal |
| --- | --- | --- |
| Sessões, cadastro, login e logout | Implementados; abrangidos pela validação anterior | `backend/app/api/auth.py`, `services/auth.py`, `frontend/src/auth/` |
| Alembic e adoção do banco existente | Validados na etapa anterior; nenhuma migração desta renovação aplicada | `backend/migrations/`, `scripts/adotar_alembic.py` |
| Upload, histórico, exclusão de arquivo e painel com dados persistidos | Implementados, com aderência parcial às regras finais de análise e qualidade | `backend/app/services/uploads.py`, `repositories/uploads.py`, `pipeline/`, `FilesSection.tsx`, `PanelDashboard.tsx` |
| Transações e Limites como áreas utilizáveis | Planejados; links internos ainda desativados | `frontend/src/components/panel/PanelSidebar.tsx` |
| Conta | Parcial; exclusão ainda anunciada como futura | `frontend/src/components/panel/AccountSection.tsx` |
| Diagnóstico mensal e notificações de limites | Planejados; não concluídos na base examinada | Planejamento, modelos e rotas existentes |

A etapa anterior de Alembic terminou com **234 testes aprovados** em ambiente isolado. Esse resultado é histórico: não valida antecipadamente esta renovação nem a implantação hospedada.

Problemas concretos que o desenho precisa resolver:

- A análise limita o detalhe a 300 lançamentos antes do filtro de categoria feito no React; o total da categoria pode representar mais registros do que a lista mostra.
- A comparação mensal usa meses disponíveis consecutivos, que podem não ser meses consecutivos do calendário.
- A análise atual soma despesas absolutas e agrupa movimentações de naturezas diferentes como entradas; estornos, receitas e pagamentos exigem semânticas separadas.
- O modelo de importação infere o sentido por maioria de sinais em um caminho, embora a planilha-modelo documente sinal fixo.
- A consulta usada no painel não entrega os identificadores necessários para editar uma transação e rastrear sua origem.

As avaliações de interface, backend/arquitetura e análise de dados foram cruzadas entre os agentes a partir das evidências do repositório levantadas pelo agente principal. Não representam três inspeções locais independentes.

## 3. Limites do trabalho

Inclui concluir os fluxos da primeira versão: importação e qualidade, análises e estatística descritiva, pesquisa de transações, correção de categorias e regra pessoal, limites mensais, notificações, diagnóstico mensal, exclusões, exemplos fictícios e preparação da execução e apresentação.

Preservar React, TypeScript, Vite e Recharts; FastAPI, pandas, SQLAlchemy, Pydantic, OpenPyXL, PostgreSQL e Alembic. Reutilizar autenticação, formulários e componentes adequados já presentes.

Continuam fora da primeira versão: chat com IA, calendário de cobranças previstas, recorrência aproximada, limites semanais, e-mails pelo Resend, mapeador genérico de colunas e armazenamento dos arquivos originais. Também não entram filas, Redis, Celery, arquitetura Medallion ou uma troca de framework, biblioteca de gráficos ou sistema de autenticação.

## 4. Experiência e linguagem visual

### 4.1 Estrutura interna comum

- Preservar a marca **gerenCIA**, o símbolo de três barras ascendentes e a família Inter Tight já usada. Algarismos tabulares em valores e colunas numéricas.
- Reutilizar os tokens existentes: petróleo noturno `#0b2a33`, tinta `#0f3440`, menta `#a7e5d6`, chão sálvia `#e3ede8`, branco e cores de apoio de `tokens.css`. Cores adicionais só para estados semânticos necessários, documentadas como tokens.
- Navegação persistente com Painel, Arquivos, Transações, Limites e Conta, estado ativo claro e sininho em toda a área interna. No celular, menu no topo com fechamento por Escape e retorno de foco.
- Conteúdo usa a largura disponível com um limite de leitura coerente. Não manter uma grande área vazia lateral enquanto gráficos e rótulos ficam comprimidos.
- Agrupar por tarefa e hierarquia; não envolver cada número ou parágrafo em um cartão. Petróleo sustenta a navegação e um destaque principal; menta orienta ação e seleção.
- Usar português direto: explicar a informação e o próximo passo. Textos como “calculado com pandas” pertencem à documentação técnica, não à apresentação cotidiana do gasto.
- Preservar a simplicidade da navegação atual. Não introduzir biblioteca de rotas ou estado global apenas para realizar o redesenho.

### 4.2 Composição do painel

Ordem de leitura:

1. **Contexto:** título curto, período selecionado, acesso a Arquivos e notificações. Abrir no mês mais recente com transações; oferecer “Todos os meses”. Sem registros, orientar envio de exemplo fictício ou arquivo.
2. **Número principal:** gasto líquido do período. Ao lado, comparação com o mês anterior quando válida e maior categoria. Quantidade de despesas aparece como apoio, com seu conjunto explicado.
3. **Categorias em foco:** ranking horizontal ordenado, com nome, valor e participação quando aplicável. O conjunto completo permanece acessível; não ocultar categorias para fazer o gráfico caber. Selecionar leva a Transações com os filtros correspondentes.
4. **Evolução:** série diária no mês selecionado; série mensal na visão histórica. Eixos, unidade e período legíveis; tooltip complementa a leitura. Evitar uma barra mensal gigante quando existe apenas um mês.
5. **Próximo passo fundamentado:** observação curta de concentração, recorrência ou limite, ligada aos dados e acompanhada de acesso à revisão correspondente.
6. **Detalhes de análise:** estatísticas, distribuição, estabelecimentos, maiores despesas, recorrências, movimentos de entrada/pagamento e diagnóstico mensal. Organizar por seções expansíveis ou alternância de visualização, sem exigir que tudo fique aberto na primeira tela.

O filtro de período deve permanecer visível ao abrir detalhes. Categoria e estabelecimento aplicados na exploração devem ser exibidos e removíveis. Links de investigação preservam o período e os identificadores do filtro na URL, para que recarregar a tela mantenha o contexto.

### 4.3 Gráficos e acessibilidade

Todos os gráficos interativos usam Recharts. Não usar efeitos 3D, animações contínuas, escalas truncadas que exagerem diferenças ou cores como único meio de comunicar um estado.

O ranking de categorias é a visualização inicial. A rosca prevista no planejamento fica como alternativa nos detalhes, apenas quando os valores permitem uma composição percentual válida. Distribuição usa histograma; estabelecimentos oferecem valor e frequência; a série temporal usa uma linha legível com pontos e intervalos honestos.

Rótulos e valores não podem se sobrepor ou desaparecer no celular. Oferecer controles por teclado e uma lista/tabela equivalente para as ações dos gráficos. Tooltips não serão o único acesso a números ou filtros. Respeitar `prefers-reduced-motion`, foco visível e contraste dos tokens existentes; alvos de toque de pelo menos 44 px.

Validar a área interna em 320, 768, 1280 e 1920 px, com zoom de 200% e navegação por teclado. Tabelas extensas podem ter rolagem horizontal identificada; a página inteira não deve transbordar.

## 5. Contrato financeiro compartilhado

### 5.1 Tipos, sinais e exclusões

`amount` representa o valor absoluto; a natureza fica em `transaction_type`: `purchase`, `fee`, `refund`, `payment`, `income` ou `other`. Incluir `income` por nova migração, mantendo a revisão inicial do Alembic imutável.

Regras comuns ao painel, categorias, evolução, limites e resumo da IA:

- **Gasto líquido = compras + tarifas − estornos**, excluindo duplicatas confirmadas.
- Receitas do extrato e pagamentos da fatura aparecem separadamente e não reduzem o gasto por categoria. Não apresentar um saldo bancário calculado da combinação de faturas e extratos.
- Planilha-modelo: negativo significa saída; positivo, entrada. O tipo de documento é escolhido no envio. Não inferir o sentido pela maioria das linhas.
- Adaptadores Nubank interpretam seus próprios sinais e campos conforme o formato reconhecido. Não transferir a convenção de um formato para outro.
- A chave de deduplicação combina usuário, formato reconhecido, tipo de documento e identificador bancário. Na planilha-modelo, o identificador opcional deve ser estável e único nesse escopo, conforme explicado no modelo; não inferir que identificadores de formatos distintos representam a mesma movimentação. Igualdade de data, descrição e valor sem identificador é uma suspeita: sinalizar e manter nos totais, sem descartar compras legítimas.
- Entre cópias equivalentes, contabilizar a do upload mais antigo, com desempate por UUID do upload, linha de origem e UUID da transação. O mesmo identificador com data, valor ou natureza divergente é conflito: recusar atomicamente o novo processamento com explicação e referência ao upload do próprio usuário, sem excluir uma versão silenciosamente.
- Um reenvio idêntico pelo hash retorna o upload já existente. A exclusão de um upload deve reavaliar cópias sobrepostas remanescentes para não excluir a mesma transação econômica dos totais para sempre.
- Sem informação suficiente para classificar, preservar `other` com explicação. Não inventar natureza ou reconstruir sinais históricos a partir de valores absolutos.

Estorno afeta o mês de seu próprio lançamento, mesmo que a compra pertença a outro mês. Quando o formato fornece vínculo inequívoco com uma compra importada, reutilizar sua categoria; sem esse vínculo, usar a precedência normal de categorização, com Outros quando desconhecida e correção manual disponível. Não associar estorno a uma compra apenas por semelhança de valor ou descrição.

Somas e reconciliações usam `Decimal` ou centavos inteiros obtidos sem conversão intermediária por ponto flutuante. Novos contratos financeiros serializam valores monetários como texto decimal com duas casas. O frontend apenas formata moeda e apresenta os resultados; não calcula totais, percentuais ou estatísticas financeiros.

Estornos podem produzir categoria ou total líquido negativo. Preservar esse resultado e explicar sua composição; usar barras que representem valores negativos. Participações e rosca ficam indisponíveis quando o total não for positivo ou houver parcelas negativas que impeçam interpretar uma divisão do todo. A maior categoria fica indisponível se não houver categoria de gasto líquido positivo.

### 5.2 Períodos e disponibilidade

- Mês é o mês do calendário pela data da transação, com limites inclusivos e explícitos. A referência para mês corrente e limites diários é `America/Sao_Paulo`.
- Outubro compara somente com setembro. Ausência do mês anterior é “sem base de comparação”; não substituir por agosto. Base anterior zero permite diferença absoluta, mas não percentual de variação.
- Um mês sem registros não comprova gasto zero. Um mês com registros válidos e nenhuma despesa pode apresentar gasto zero, acompanhado desse contexto.
- Informar que a análise representa os dados importados e seu intervalo observado. Não afirmar cobertura bancária integral a partir da primeira e última compra.
- Na série diária, dias sem lançamento podem representar zero **nos dados importados**; meses sem registros aparecem como lacunas na série histórica. Diferenciar mês em andamento de mês encerrado e evitar interpretar automaticamente um mês parcial como economia.
- “Todos os meses” agrega o período disponível e não recebe rótulo de variação mensal. A comparação do diagnóstico sempre corresponde a um mês explícito.

### 5.3 Estatísticas e recorrência

Entregar as medidas previstas por período e categoria: quantidade, média, mediana, moda de categoria e estabelecimento, mínimo, máximo, amplitude, desvio padrão populacional (`ddof=0`), quartis com interpolação linear, intervalo interquartil e histograma. Estatísticas de valores usam apenas compras e tarifas elegíveis, sem receitas, pagamentos, estornos ou duplicatas confirmadas. Não confundir média das despesas com gasto líquido dividido pela quantidade.

Com menos de quatro despesas, desvio padrão, quartis e intervalo interquartil aparecem como “dados insuficientes”; média, mediana e contagem continuam disponíveis quando há observações. Sem despesas, medidas de posição e dispersão ficam indisponíveis, em vez de produzir valores artificiais. Informar a quantidade e o conjunto de observações; contagem de despesas e contagem de todas as transações recebem rótulos diferentes.

Recorrência segue a regra documental: mesmo estabelecimento e valor em todos os meses com registros do histórico importado, com pelo menos dois meses, excluindo parcelas e duplicatas confirmadas. A detecção consulta o histórico completo, independentemente do mês selecionado, e a seção informa esse contexto. Exibir os meses usados como evidência e as lacunas: agosto e outubro disponíveis não comprovam continuidade em setembro. Mostrar o total do mês mais recente observado e seu custo anualizado, identificado como extrapolação de 12 meses, sem previsão de datas. Um serviço reconhecido pelo nome em um único mês pode ser apresentado como assinatura identificada, mas não como recorrência confirmada.

## 6. Abas e fluxos completos

### 6.1 Transações e correção de categoria

Pesquisar e filtrar no servidor por período, categoria, estabelecimento, texto, valor mínimo e máximo, com ordenação e paginação. O filtro ocorre **antes** da paginação. A resposta contém total de registros e agregados do conjunto filtrado, não somente da página. A ordem tem um desempate estável pelo identificador da transação.

Cada item apresenta identificador, data, descrição/estabelecimento, valor, natureza, categoria, origem e indicação de duplicata ou suspeita quando aplicável. O detalhe permite conferir upload e linha de origem. A apresentação distingue duplicata confirmada excluída dos totais de suspeita mantida para conferência.

A pessoa pode alterar uma categoria e, opcionalmente, salvar regra pessoal para importações futuras do mesmo estabelecimento normalizado. A regra pessoal tem precedência sobre categoria do banco, regra de estabelecimento, palavra-chave e Outros. Salvar uma regra não recategoriza silenciosamente todo o histórico; a correção atual modifica o item selecionado. Não oferecer cadastro de categorias ou edição de valores/datas, ausentes do escopo aprovado.

Depois de uma correção, atualizar as consultas afetadas: painel, estatísticas, limites e avisos do mês corrente. Diagnóstico previamente gerado deve indicar que os dados mudaram. Falha ao salvar mantém a edição visível para nova tentativa e não publica alteração otimista como concluída.

### 6.2 Limites e notificações

Limite é opcional, mensal, em BRL e maior que zero. A configuração ativa por usuário e categoria usa período `monthly`; o mesmo valor configurado é comparado ao mês consultado. Não criar limites semanais nem valores diferentes agendados para cada mês nesta versão.

Mostrar gasto líquido da categoria no mês, limite, percentual utilizado e valor restante. Excesso preserva percentual acima de 100% e restante negativo; não esconder o excesso por limitar a barra visual a 100%. Categorias sem limite exibem uma ação clara para definir valor, sem aviso automático.

O sininho gera no máximo um aviso por usuário, categoria, mês e faixa: ao atingir 80% e ao passar de 100%. Exatamente 100% não é ultrapassagem. Se uma alteração saltar diretamente para 110%, registrar as duas faixas uma única vez e apresentar a ultrapassagem primeiro. Meses anteriores têm situação consultável, mas não geram avisos novos.

Reavaliar após upload, exclusão de arquivo, correção de categoria e criação, alteração ou remoção de limite. Oscilar abaixo e acima da faixa não gera avisos repetidos no mesmo mês. Manter histórico de avisos com data e indicação de leitura; a tela de Limites sempre mostra a situação atual. Oferecer marcar um ou todos como lidos, com contador coerente.

A unicidade usa `(user_id, category_id, month, threshold)`, sem depender do identificador ou valor da configuração do limite. Alterar, excluir e recriar um limite no mesmo mês preserva a memória das faixas já avisadas. Avisos emitidos permanecem como histórico quando o gasto cai após correção ou exclusão; não são apresentados como uma medição atual.

### 6.3 Arquivos e qualidade

Preservar `/app/files` como endereço da área existente e alinhar os documentos que ainda usam `/app/uploads`; não criar duas áreas concorrentes. APIs de arquivos continuam em `/api/uploads`.

Concluir o reconhecimento de extrato e fatura Nubank e da planilha-modelo em CSV/XLSX, limite de 5 MB, seleção de tipo do documento no modelo e downloads dos modelos e exemplos fictícios. Manter processamento síncrono e atômico: falha de reconciliação não deixa upload ou linhas parcialmente gravados.

Histórico mostra nome, tipo, formato, envio, período observado, linhas válidas/rejeitadas, qualidade e totais identificados corretamente. O detalhe expõe completude, validade, unicidade e consistência, além das rejeições com número da linha, motivo e download.

Reconciliações: linhas = válidas + rejeitadas; categorias = gasto líquido; saldo inicial + movimentos = saldo final quando houver dados de saldo suficientes. Preservar identificador bancário e saldo disponíveis nos adaptadores. Sem saldo suficiente, indicar verificação não disponível, sem fabricar aprovação. Nenhuma linha some silenciosamente.

Recomendar os exemplos fictícios e explicar a retenção das transações de arquivos reais. O arquivo original não é guardado. Exclusão de arquivo tem confirmação no produto, remove seus dados dependentes e atualiza as análises. A qualidade do processamento permanece um registro da importação; não deve ser confundida com estatísticas atuais após correções manuais.

### 6.4 Conta

Apresentar nome e e-mail já disponíveis e concluir a exclusão da própria conta, com confirmação clara das consequências. A operação remove dados financeiros e sessões de forma atômica; o cookie é encerrado e a pessoa retorna à área pública. Falha não deve aparentar exclusão concluída. Recuperação de senha, verificação de e-mail e edição de perfil não são adicionadas nesta rodada.

## 7. Diagnóstico mensal com IA e custo zero

O diagnóstico complementa as análises determinísticas. Sem IA disponível, totais, gráficos, explicações verificáveis e revisão de despesas continuam funcionando; não apresentar um texto determinístico como se fosse gerado por IA.

Desenho da integração:

- Chamada isolada em `backend/app/ai/`, sem dependência de FastAPI ou acesso direto ao banco pelo modelo. Um adaptador de provedor e um cliente falso de testes são suficientes.
- Geração somente por ação explícita e para mês com despesas. Avisar antes da ação que serão enviados agregados ao provedor.
- Resumo calculado pelas mesmas funções das telas: gasto, categorias, comparação, limites, principais estabelecimentos, maiores valores e estatísticas. Não enviar arquivo, descrição bruta, lista individual de transações, nome, e-mail, identificadores pessoais ou credenciais. Representar maiores despesas por valores e categoria, sem texto livre da origem.
- Resposta validada por Pydantic: resumo, até três destaques e até três sugestões, cada item vinculado a uma categoria ou estabelecimento fornecido. Incluir referências estruturadas às métricas usadas; os valores exibidos vêm dessas métricas validadas. Valores e referências citados devem corresponder ao resumo; não aceitar cálculos inventados, promessas de economia ou instruções para alterar dados.
- Um diagnóstico guardado por usuário e mês; regeneração bem-sucedida substitui o anterior. Erro preserva o último válido, com sua data e contexto. Alteração dos dados torna visível que o diagnóstico precisa ser atualizado, com identificação da base usada.
- Padrão proposto: no máximo **três tentativas que chegam ao provedor por usuário e dia**, incluindo regenerações. Reservar tentativas de forma atômica no PostgreSQL, inclusive em chamadas concorrentes. Consulta ao diagnóstico salvo e recusas locais não chamam a API.
- Falha comprovadamente anterior ao envio libera a reserva. Após o envio, ou quando não for possível comprovar que ele não aconteceu, a tentativa permanece consumida, inclusive em timeout ou interrupção. Não usar uma falha de rede como justificativa para disparar outra chamada automaticamente.
- Permitir somente uma geração em andamento por usuário/mês; outra solicitação recebe conflito sem consumir tentativa. Usar identidade da geração e da base de dados consultada para que uma resposta atrasada não sobrescreva um diagnóstico mais recente. Se os dados mudarem durante a geração, não publicar a resposta como diagnóstico atual e explicar a necessidade de nova geração. A reserva de execução tem expiração limitada pelo timeout, sem liberar a tentativa diária já enviada.
- A integração deve ter timeout finito, impedir disparos duplicados e não repetir automaticamente chamadas que consomem cota. Erro, resposta inválida ou cota esgotada apresentam mensagem compreensível e nova tentativa manual quando cabível.
- Chave somente no ambiente do backend. Sem credencial ou sem cota gratuita confirmada, geração fica indisponível com motivo claro. Não habilitar plano pago ou fallback pago.

**Avaliação técnica proposta:** começar pelo plano Free da Groq, com modelo configurável que suporte resposta estruturada; `openai/gpt-oss-20b` é o candidato inicial. A documentação consultada em 16/11/2026 descreve plano gratuito, limites por organização/modelo e suporte do candidato a JSON Schema estrito. Isso não comprova disponibilidade ou capacidade da conta do projeto: confirmar ambas antes de habilitar a integração real. Ver [limites](https://console.groq.com/docs/rate-limits), [saída estruturada](https://console.groq.com/docs/structured-outputs) e [planos](https://console.groq.com/docs/billing-faqs).

A política do provedor descreve não retenção por padrão para inferência, com exceções de confiabilidade e abuso; não anunciar retenção zero absoluta. A escolha técnica deve considerar essas exceções e os controles da conta. Ver [tratamento dos dados](https://console.groq.com/docs/your-data). Não é necessário cadastrar conta, fornecer cartão ou enviar credenciais para revisar esta especificação.

A validação real em cota gratuita é condição de conclusão do diagnóstico; testes com cliente falso não substituem esse teste. A falta de cota bloqueia somente essa validação, deve ser relatada e não autoriza declarar a primeira versão integralmente concluída.

## 8. Arquitetura, contratos e persistência

Manter o fluxo **rota → serviço → repositório → banco**. Funções do pipeline recebem e devolvem dados simples e continuam independentes de FastAPI e SQLAlchemy. Serviços coordenam importação, transações, limites, avisos e persistência do diagnóstico.

Uma definição compartilhada de período, tipos e elegibilidade sustenta agregados, categorias, séries e limites. Não criar implementações distintas dos mesmos cálculos no painel e na IA. Repositórios aplicam usuário e filtros; o serviço distingue a consulta agregada completa da consulta paginada de itens. Evitar N+1 e carregamento de todas as transações no navegador.

Preservar `/api/dashboard` como fachada de compatibilidade enquanto os consumidores existentes precisarem dela, incluindo nomes de campos e tipos JSON esperados. Um adaptador de saída mantém os números JSON legados; os novos contratos usam texto decimal. Os endpoints de `/api/analytics/` previstos no planejamento expõem resumo, categorias, estabelecimentos, evolução, maiores despesas e comparação, delegando ao mesmo serviço de análise. A fachada não contém uma segunda implementação financeira. Documentar DTOs e manter o fluxo existente utilizável durante a troca dos consumidores.

Concluir os contratos planejados de `/api/transactions`, `/api/budgets`, `/api/notifications`, `/api/insights` e `DELETE /api/auth/me`. Usar schemas Pydantic e tipos TypeScript correspondentes, com disponibilidade/motivo explícitos para medidas sem base, além dos dados de período e filtros. A tela carrega análises detalhadas quando necessárias; não baixa uma tabela inteira para montar indicadores.

No frontend, compartilhar seletor de período, formatação, estados de vazio/erro/carregamento, controles de formulário e estrutura de página quando houver repetição real. Manter gráficos e regras de apresentação específicos quando isso facilitar entendimento. Não criar uma plataforma genérica de gráficos, novos serviços externos ou camadas de abstração sem uso concreto.

Todas as consultas e alterações recebem o usuário da sessão; nenhum payload escolhe `user_id`. Recurso de outra pessoa responde como inexistente. Manter cookies HttpOnly, política de mesma origem e respostas financeiras sem cache público. Durante troca rápida de filtros, a resposta antiga não pode sobrescrever a seleção mais recente.

Persistência:

- Alterações são novas revisões Alembic; não modificar `0001_current_schema` ou sua assinatura para acomodar o novo esquema.
- Adequar uploads com tipo/formato/período, transações com natureza e origem necessárias, e adicionar limites, notificações e diagnósticos conforme o planejamento. Reutilizar as tabelas de categorias, regras, qualidade e rejeições existentes.
- Retirar as estruturas legadas de Medallion/mapeamento e campos de arquivo original conforme o modelo-alvo documental, depois de preservar a rastreabilidade e verificar os dados existentes. Não ativar essas estruturas como nova arquitetura de processamento.
- Dados históricos que perderam sinal, identificador ou tipo não podem ser reconstruídos por adivinhação. Preservar os registros, identificar a limitação e orientar revisão ou reimportação quando necessária. A migração deve distinguir preenchimento comprovável de ausência de informação.
- Validar migrações em PostgreSQL descartável, tanto instalação nova quanto evolução de cópia representativa da base anterior, com contagens e relações preservadas. Não aplicar no banco de uso durante a revisão desta especificação.

## 9. Estados e recuperação

Cada área deve distinguir carregamento, vazio inicial, filtro sem resultado, medida indisponível, erro de validação e indisponibilidade do servidor. Mensagens explicam a causa útil e oferecem uma ação real. Não substituir falha de API por números zerados ou exemplos fictícios sem identificação.

O painel vazio oferece envio e exemplos. Transações sem resultado permitem limpar filtros. Formulários preservam dados após erro. Upload informa formato/colunas esperados e não publica resultados parciais. Sessão expirada leva ao login. Exclusões e mudanças mostram conclusão somente após confirmação da API.

Falha do diagnóstico não impede navegar ou revisar gastos. Notificações exibem contexto de data/faixa para que um aviso histórico não seja confundido com o estado atual do limite.

## 10. Entregas e colaboração

Esta é a sequência funcional, a detalhar em um plano posterior à aprovação escrita:

| Entrega | Resultado verificável | Dependência |
| --- | --- | --- |
| 1. Base financeira e importação | Tipos, sinais, duplicatas, qualidade e reconciliação coerentes | Contrato desta especificação e novas migrações necessárias |
| 2. Painel e Transações | Composição escolhida ligada a registros completos, filtráveis e rastreáveis | Contratos de análise e consulta estáveis |
| 3. Correção de categorias | Alteração atual e regra pessoal futura com atualização das análises | Identificadores e autorização |
| 4. Limites e sininho | Gasto mensal e faixas corretas, sem avisos repetidos | Regra financeira e eventos de alteração |
| 5. Diagnóstico | Resposta validada, persistência e limites de uso; validação gratuita real | Agregados estáveis e cota disponível |
| 6. Fechamento da primeira versão | Arquivos/Conta completos, exemplos, execução, documentação e ensaio | Fluxos integrados e verificações aprovadas |

Arquivos, Conta e composição visual podem avançar em paralelo quando não dependerem dos contratos em revisão. Os especialistas trabalham com responsabilidades claras: interface e acessibilidade; backend e persistência; semântica financeira e análise. O agente principal integra decisões e mudanças. Um especialista revisa o efeito de cada contrato no trabalho do outro; não manter cópias divergentes das regras nem edições concorrentes sem coordenação no mesmo arquivo.

O plano deve prever lotes pequenos, validação proporcional e um ponto utilizável ao fim de cada entrega. O prazo não autoriza ocultar funcionalidades pendentes ou usar dados fictícios como se fossem dados reais integrados.

## 11. Critérios de aceite e evidências

| ID | Critério observável | Verificação prevista |
| --- | --- | --- |
| A01 | Compra de R$ 100, tarifa de R$ 10 e estorno de R$ 20 resultam em gasto de R$ 90; receita e pagamento não alteram esse total | Fixture pequena com resultado manual; painel, categoria, limite e resumo de IA conferem |
| A02 | Um item depois da posição 300 continua pesquisável e integra os totais do filtro | API paginada com mais de 300 transações e investigação pela interface |
| A03 | Outubro sem setembro não compara com agosto; base zero e mês parcial têm apresentação apropriada | Testes de período e estados visuais |
| A04 | Estatísticas completas seguem as regras da seção 5.3, incluindo amostras pequenas e conjunto vazio | Pytest com valores calculados à mão e conferência nos detalhes |
| A05 | Hash repetido e identificador bancário sobreposto não duplicam gasto; suspeita sem identificador permanece; conflito não grava parcialmente; exclusão da cópia contabilizada promove a remanescente e preserva o total | Integração de uploads e exclusão |
| A06 | CSV/XLSX Nubank e modelo são reconhecidos; sinais são estáveis e nenhuma linha desaparece | Fixtures de leitura/limpeza; linhas = válidas + rejeitadas |
| A07 | Quatro dimensões de qualidade disponíveis; falha de reconciliação cancela toda a gravação | Testes de serviço/DB, relatório e download de rejeições |
| A08 | Clique em categoria/estabelecimento abre exatamente seus lançamentos no período, com ação equivalente por teclado | Playwright e comparação com agregados da API |
| A09 | Correção muda os totais consumidores; regra pessoal prevalece em upload futuro sem alterar silenciosamente o histórico | Integração de categoria, importação, análise e limites |
| A10 | Limites opcionais usam o mesmo gasto; 80%, exatamente 100%, mais de 100%, salto, oscilação e recriação de limite respeitam as faixas sem repetição | Testes unitários/integrados, inclusive concorrência e mês anterior |
| A11 | Sininho mantém contador e leitura; mudança de gasto ou exclusão atualiza a situação atual sem duplicar aviso | Integração e fluxo Playwright |
| A12 | Diagnóstico envia só agregados permitidos, valida estrutura/referências, respeita tentativas e não chama provedor quando recusado; timeout e chamadas concorrentes não contornam a cota nem publicam resposta antiga | Cliente falso, teste de concorrência e revisão do payload sem dados pessoais |
| A13 | Diagnóstico real é gerado dentro da cota gratuita, salvo e consultável; falhas não exibem resposta inválida nem autorizam cobrança | Ensaio controlado com dados fictícios e conta Free confirmada |
| A14 | Upload e conta podem ser excluídos com seus dependentes; sessão deixa de valer após exclusão da conta | Integração com PostgreSQL e verificação de interface |
| A15 | Usuário A não consulta nem altera arquivos, itens, regras, limites, avisos ou diagnósticos de B | Testes de autorização com dois usuários |
| A16 | Todas as abas internas têm identidade consistente, filtros claros e estados reais; sem links “em breve” para funções obrigatórias | Revisão visual nas larguras definidas, zoom, teclado e movimento reduzido |
| A17 | Instalação nova e evolução do esquema funcionam; revisão inicial permanece intacta | Alembic em banco descartável, conferência de dados e `alembic check` |
| A18 | Projeto inicia com o fluxo Docker Compose documentado, e a versão de apresentação funciona na mesma origem com login/upload | Smoke test do ambiente local e hospedado, quando autorizada a publicação |
| A19 | Documentação reflete recursos concluídos e pendências reais; exemplos de extrato e fatura permitem demonstração sem dados pessoais | Revisão de README/PRODUCT/DESIGN/arquitetura e ensaio do percurso completo |

Escrever testes pytest das funções e regras alteradas junto com a implementação, incluindo casos normais e erros relevantes. Estender os scripts Playwright existentes em `scripts/frontend/` para os fluxos críticos; não introduzir testes unitários de frontend ou uma segunda infraestrutura de testes nesta rodada. Executar verificações de tipos/build e regressão de acesso/página pública proporcionais às mudanças compartilhadas.

Uma entrega só é concluída com evidência. A primeira versão inteira exige os critérios documentados, inclusive validação real da IA e ambiente de apresentação; recurso parcial ou bloqueado permanece identificado como tal.

## 12. Revisão e próximo passo

Decisões técnicas incluídas na especificação aprovada, além das escolhas feitas na entrevista: abrir no mês mais recente; exibir valores líquidos negativos sem percentual enganoso; usar configuração mensal de limite por categoria; não aplicar regra pessoal retroativamente; três tentativas de IA por usuário/dia; avaliar Groq Free como primeira integração.

Condições externas verificáveis antes de declarar conclusão: conta/cota gratuita e credencial de IA disponíveis no backend, PostgreSQL adequado e destino de hospedagem gratuito com mesma origem. Não se presume que essas condições estejam resolvidas apenas por este documento.

Com a especificação aprovada, o próximo entregável é o plano escrito com tarefas, dependências, verificações e divisão do trabalho entre os especialistas. A aprovação da proposta ou deste documento não declara o código implementado, migrado, publicado ou enviado ao repositório remoto.
