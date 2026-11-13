# Arquitetura do gerenCIA

O gerenCIA transforma extratos bancários e faturas de cartão, em CSV e XLSX, em
análises financeiras pessoais e guarda o histórico de todos os arquivos enviados. Este
é o mapa rápido da arquitetura planejada. O [planejamento completo](planejamento-gerencia.txt)
define os requisitos; a tabela de estado ao final mostra o que já existe.

## Divisão de responsabilidades

O frontend apresenta os dados. O backend autentica o usuário, aplica as regras,
processa os arquivos e acessa o PostgreSQL. Os blocos dentro do backend são
módulos da mesma aplicação FastAPI, não serviços separados.

```mermaid
flowchart LR
    person["Pessoa"] --> frontend["React e Recharts"]
    frontend <-->|"HTTP e JSON"| api

    subgraph backend ["Backend FastAPI"]
        api["API e autenticação"] --> services["Serviços e casos de uso"]
        services --> repositories["Repositórios e SQLAlchemy"]
        services --> pipeline["Leitura, limpeza e análises"]
        services --> ai["Diagnóstico com IA"]
    end

    repositories <--> database[("PostgreSQL")]
    ai -->|"Resumo agregado do mês"| provider["Provedor de IA"]
```

| Parte | Onde fica | Responsabilidade |
|---|---|---|
| Interface | `frontend/src/` | Páginas, formulários, filtros e gráficos |
| API e contratos | `backend/app/api/` e `schemas/` | Receber requisições, validar entradas e formatar respostas |
| Configuração e segurança | `backend/app/core/` | Configuração, sessões, segurança e erros compartilhados |
| Serviços | `backend/app/services/` | Coordenar os casos de uso e o usuário autorizado |
| Persistência | `backend/app/repositories/`, `models/` e `db/` | Consultas, modelos e conexão com PostgreSQL |
| Processamento | `backend/app/pipeline/` | Leitura, limpeza, categorização e cálculos das análises |
| IA | `backend/app/ai/` | Montar o resumo do mês, chamar o provedor e validar a resposta |
| Testes | `backend/tests/` e `scripts/frontend/` | Testes unitários e de integração com pytest; verificações da interface com Playwright |

Crie os módulos futuros quando houver funcionalidade para implementar. A direção
de dependência é `API → Serviços → Repositórios → Banco`. Serviços também
coordenam o pipeline e a IA; nenhum dos dois depende do FastAPI. Análises,
limites e notificações são implementados nos serviços e no pipeline conforme
necessário, sem adicionar outra aplicação.

## Caminho de um arquivo

Este diagrama representa os dados ao longo do processamento, não as dependências
entre arquivos Python. Os conceitos de análise de dados aplicados em cada passo
estão em [análise de dados](analise-de-dados.md). A API e os serviços coordenam o fluxo; os repositórios
persistem os registros.

```mermaid
flowchart TD
    file["Extrato ou fatura em CSV ou XLSX"] --> upload["Validar o arquivo e calcular o hash"]
    upload --> read["Ler com pandas e reconhecer o formato"]
    read --> treatment["Limpar, validar e categorizar"]
    treatment -->|"Linhas válidas"| transactions["Transações padronizadas"]
    treatment -->|"Linhas inválidas"| rejected["Rejeições e seus motivos"]
    treatment --> quality["Relatório de qualidade"]
    transactions --> analytics["Análises e estatística, calculadas na consulta"]
    analytics --> dashboard["Dashboard apresenta os resultados"]
    analytics --> limits["Comparar o gasto do mês com os limites"]
    limits -->|"80% ou 100% do limite"| bell["Notificação no sininho do painel"]
    analytics --> ai["Diagnóstico do mês com IA"]
```

O arquivo é processado durante a própria requisição de upload e gravado numa
única transação do banco: ou entram as transações, as rejeições e o relatório
de qualidade, ou nada entra. O arquivo original não é guardado. As análises são
calculadas na consulta, a partir das transações, sem tabelas de resultados
pré-calculados. A primeira versão não usa a arquitetura Medallion nem
processamento em segundo plano.

## Hospedagem

A versão da banca será publicada em planos gratuitos e usada pela turma e pela
banca. O frontend e a API ficam na mesma origem: em domínios diferentes, o
navegador não envia o cookie de sessão `SameSite=Lax` nas chamadas à API. A
primeira publicação acontece já na etapa de upload, para que problemas de
hospedagem apareçam cedo. A chave do provedor de IA fica nas variáveis de
ambiente da hospedagem, nunca no frontend.

## Regras para manter o projeto organizado

- Rotas HTTP delegam os casos de uso aos serviços; consultas ficam nos repositórios.
- Valores monetários usam `Decimal` no processamento e coluna numérica no banco.
- Toda operação financeira usa o usuário obtido da sessão. O frontend não escolhe
  o dono dos dados. Categorias globais são a exceção pública já implementada.
- O backend calcula as métricas reais; o frontend as apresenta. A demonstração
  pública pode calcular exemplos fictícios em `demoModel.ts`, sem dados pessoais.
- PostgreSQL é a única persistência; o arquivo original não é guardado. Redis,
  Celery, Kafka e outros serviços continuam fora da primeira versão.
- A IA recebe somente o resumo agregado do mês e explica as análises; os
  cálculos continuam no backend.
- Toda função de leitura, limpeza, análise e regra de negócio tem testes
  unitários com pytest, entregues no mesmo pull request.
- Cada etapa tem uma branch própria, mesclada na `main` por pull request.
- Testes do banco usam um servidor PostgreSQL temporário separado do banco de
  desenvolvimento. Produção será configurada na implantação.
- Mantenha os testes de interface em `scripts/frontend/`. Capturas geradas vão
  para `.impeccable/review/`, ignorada pelo Git.
- Ao substituir um arquivo, atualize imports, testes e documentação e retire a
  versão obsoleta. Dependências, caches e builds locais ficam fora do Git.

## Estado atual e próximos ajustes

| Parte | Estado atual |
|---|---|
| PostgreSQL e SQLAlchemy | Conexão funcionando, 10 tabelas mapeadas e 11 categorias globais ativas |
| API | Saúde, categorias, autenticação, upload, histórico e exclusão em `/api/uploads`; análise em `/api/dashboard`, preservada do PR #2 da main |
| Frontend | Demonstração pública; autenticação real; painel vazio sem transações e dashboard com dados da conta; arquivos em `/app/files` (alias `/app/uploads`) e conta |
| Testes do banco | Suíte de integridade e códigos numéricos existente; não reexecutada nesta revisão. Validação atual por build e integração em PostgreSQL temporário, sem testes unitários |
| Camadas do backend | Autenticação usa serviço e repositórios; a rota de categorias usa o repositório `repositories/categories.py`, sem serviço, porque ainda não tem regra de negócio |
| Funcionalidades financeiras | Leitura, limpeza e dashboard da segunda versão da main preservados. Esta revisão não desenvolveu novas análises. Limites, notificações, IA e partes do tratamento e da qualidade seguem pendentes; ver revisao-alteracoes.md |
| Hospedagem | Site informado em `https://gerencia-liart.vercel.app`; alterações locais precisam de nova publicação para aparecer nesse endereço |
| Fora da primeira versão | Conversa com a IA, previsão de cobranças com calendário, mapeador genérico, arquivo original guardado, e-mails pelo Resend e limite semanal (seção 18 do planejamento) |
| Migrações | Alembic configurado e adoção aplicada no Neon em 12/11/2026, na revisão `0002_upload_history`. Contagens dos registros preservadas nas 10 tabelas; comparação com os modelos sem alterações pendentes |
| Ferramentas previstas | Docker Compose e limite de tentativas de login ainda pendentes |

Escopo da preparação aprovada em 12/11/2026: concluir as telas de painel e
arquivos, preparar os componentes para receber resultados e concluir a
configuração do Alembic. Não inclui escrever ou executar testes unitários,
criar análises, ampliar o tratamento, desenvolver Limites ou IA. As regras de
testes do planejamento continuam valendo para a etapa de dados posterior.

Na revisão seguinte, a `main` remota estava em `d741130` (PR #2, segunda
versão). Ela foi integrada apenas à branch `feat/alembic-upload-historico`,
preservando os fluxos existentes. A implementação alternativa de upload foi
retirada para não manter dois contratos incompatíveis. O novo protótipo de
janela de envio permanece separado e não foi aplicado ao produto.

O esquema atual ainda tem peças do desenho anterior: a tabela `bronze_rows`, a
coluna `transactions.bronze_row_id`, a tabela `upload_mappings` e as colunas
`storage_path` e `status` de `uploads`. Foram preservadas nesta preparação para
não remover registros antigos. A revisão `0002_upload_history` acrescenta o
tipo do documento, formato reconhecido, período e identificador bancário, e
aceita `income`. As tabelas `category_budgets`, `notifications` e `ai_insights`
continuam para as respectivas etapas futuras.

Os SQL de `scripts/migrations/` foram preservados como histórico. A migração
inicial tem uma cópia independente do esquema em `backend/migrations/sql/`.
O [guia do banco](database-setup.md) explica instalação, adoção e atualizações.

## Documentos de apoio

- [Análise de dados](analise-de-dados.md): transformação, limpeza e qualidade, estatística descritiva.
- [Planejamento completo](planejamento-gerencia.txt): requisitos, etapas e critérios de aceite.
- [Configuração do banco](database-setup.md): instalação, atualizações e testes isolados.
- [Guia de conversão de valores](guia-conversao-valores.md): primeira atividade de programação acompanhada.
- [Verificações do frontend](../scripts/frontend/README.md): preparação das ferramentas e comandos atuais.
