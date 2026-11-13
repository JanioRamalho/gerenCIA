# Gerencia

Aplicação web de gestão e análise financeira baseada em extratos bancários e
faturas de cartão, em CSV e XLSX, com o histórico de todos os arquivos enviados.

O frontend já oferece uma demonstração interativa com dados fictícios, cadastro,
login e o painel do usuário em `/app`. Sem transações, mostra indicadores e
gráficos em estado vazio. Com dados, mantém o dashboard analítico integrado
na segunda versão da `main`, pelo PR #2. `/app/files` oferece envio, histórico
e exclusão de arquivos; `/app/uploads` continua aceito como endereço alternativo.

## Arquitetura

React e Recharts formam a interface; FastAPI concentra os casos de uso,
o processamento dos arquivos e o acesso ao PostgreSQL.

Comece pelo [mapa da arquitetura com diagramas Mermaid](docs/arquitetura.md).
Ele mostra as responsabilidades, o caminho de um arquivo e o estado atual.
O [planejamento completo](docs/planejamento-gerencia.txt) detalha os requisitos.

## Análise de dados

A análise de dados é o eixo central do projeto. O documento
[análise de dados](docs/analise-de-dados.md) explica como o gerenCIA
transforma os arquivos com pandas, mede a limpeza e a qualidade dos dados e
calcula a estatística descritiva dos gastos, e onde cada conceito aparece no
código. O painel já consulta as análises de transações gravadas. Está previsto
um diagnóstico mensal com IA para explicar os resultados em linguagem simples
e sugerir onde economizar.

## Qualidade de software

Hoje os testes com pytest cobrem a autenticação, a integridade do banco, os
códigos de exibição, as configurações e as rotas de saúde. Os que usam banco
rodam contra um PostgreSQL temporário, criado e apagado a cada execução, e a
interface tem verificações com Playwright em `scripts/frontend/`.

A regra do projeto vale para o que ainda será construído: cada função de
leitura, limpeza, análise e regra de negócio entra com os seus testes unitários
no mesmo pull request.

## Diretórios

- backend/: API, domínio financeiro, pipeline, persistência e testes.
- frontend/: aplicação React, funcionalidades, componentes e testes.
- docs/: planejamento do produto e da arquitetura.
- scripts/: tarefas auxiliares de desenvolvimento.

## Ordem prevista

1. Fundação: backend, banco e autenticação.
2. Upload e histórico de arquivos.
3. Leitura, limpeza, categorização e qualidade.
4. Análises e estatística descritiva.
5. Dashboards React e Recharts.
6. Limites por categoria e notificações no painel.
7. Diagnóstico do mês com IA.
8. Consolidação, testes e empacotamento.

A banca será na primeira semana de dezembro de 2026; o cronograma semanal está
na seção 14 do [planejamento](docs/planejamento-gerencia.txt). A previsão de
cobranças com calendário, o mapeador genérico, a conversa com a IA, os e-mails
pelo Resend e o limite semanal ficaram para depois da primeira versão (seção
18). O mapa da
arquitetura distingue as funcionalidades existentes das etapas previstas.

Cada etapa é desenvolvida em uma branch própria e mesclada na `main` por pull
request.

A [revisão desta entrega](docs/revisao-alteracoes.md) registra a limpeza e a
compatibilidade com a `main`. As [mensagens de commit](docs/mensagens-commit.md)
estão salvas por grupo de alteração.

## Como iniciar a API

No PowerShell, a partir da pasta principal do projeto, execute sempre que quiser usar a API localmente:

~~~powershell
.\.venv\Scripts\python.exe -m uvicorn app.api.main:app --app-dir backend --reload
~~~

Deixe o terminal aberto enquanto usa a API. Acesse http://127.0.0.1:8000/api/health para verificar a resposta {"status":"ok"} ou http://127.0.0.1:8000/docs para abrir a documentação automática. Para parar o servidor, pressione Ctrl+C.

O comando usa o ambiente virtual .venv da pasta principal, com FastAPI e Uvicorn instalados. A conexão com PostgreSQL exige `DATABASE_URL` no `.env` e o driver `psycopg` no ambiente Python. Com a API no ar, o `npm run dev` do frontend encaminha `/api` para `http://127.0.0.1:8000`; para apontar para outro endereço, defina `GERENCIA_API_URL`. Cadastro e login levam ao painel do usuário em `/app`, com dados da própria conta. A demonstração pública continua usando dados fictícios. Para o site funcionar por completo, deixe dois terminais abertos: um com a API e outro com o `npm run dev`.

## Banco de dados

O Alembic versiona o esquema e preserva o SQL histórico na migração inicial.
Para um banco existente, confira e adote com `scripts/adopt_alembic.py`; para
um banco vazio, use `alembic upgrade head`. Migrações exigem o proprietário
das tabelas: configure `MIGRATION_DATABASE_URL` no `.env` se a conexão da API
não tiver essa permissão. O banco em si precisa existir. Consulte o
[guia de instalação, atualização e testes](docs/database-setup.md).

## Como iniciar o frontend

No terminal, a partir da pasta principal do projeto, execute:

```bash
cd frontend
npm install
npm run dev
```

Em seguida, abra no navegador o endereço exibido pelo terminal, normalmente `http://localhost:5173`.
