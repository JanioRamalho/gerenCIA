# Gerencia

Aplicação web de gestão e análise financeira baseada em extratos bancários e
faturas de cartão, em CSV e XLSX, com o histórico de todos os arquivos enviados.

O site oferece uma demonstração interativa com dados fictícios. No painel
logado, a pessoa pode importar arquivos, acompanhar gastos, revisar a categoria
dos lançamentos e definir limites mensais com avisos no painel.

- [Testes automatizados e roteiro de demonstração](docs/testes.md)
- [IA: perfil de gastos e detecção de anomalias](docs/ia-perfil-de-gastos.md)
- [Checklist da entrega acadêmica A3](docs/a3.md)

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
código. O modelo próprio de [perfil de gastos e detecção de anomalias com regressão linear](docs/ia-perfil-de-gastos.md)
identifica meses fora do padrão do usuário (demonstração rápida no terminal via
`.\.venv\Scripts\python.exe scripts/demonstrar_ia.py`).

## Qualidade de software

A suíte pytest cobre regras de autenticação, leitura, limpeza e análise de
dados. Ela também verifica rotas HTTP, PostgreSQL temporário e inicialização
do Uvicorn. Os roteiros Playwright exercitam os fluxos no navegador.

```powershell
.\.venv\Scripts\python.exe backend/tests/rodar_todos.py
.\.venv\Scripts\python.exe backend/tests/rodar_teste.py --codigo
```

O primeiro comando roda os testes unitários e de integração. O segundo
abre o menu para escolher um caso. Os testes sobem seu próprio banco e
servidor quando necessário.
O [guia de testes](docs/testes.md) mostra como rodar por camada e demonstrar
sucesso e erros esperados.

Com a API local rodando, use `.\.venv\Scripts\python.exe scripts/verificar_login.py`
para [mostrar o resultado de um login no terminal](docs/testes.md#demonstrar-uma-tentativa-de-login-no-terminal).
O [roteiro para a banca](docs/testes.md#casos-básicos-para-a-banca) inclui
comandos interativos para nome, e-mail, senha, fatura, data, parcela, API e
saúde do servidor. O [demonstrador](backend/tests/demonstrar_testes.py) fica
junto dos testes do backend.

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

## Instalação local

Os comandos usam PowerShell. Instale Git, Python 3.14 e Node.js 22 com npm.
O banco local e a suíte de testes de integração também exigem PostgreSQL 18.
Os roteiros Playwright usam o Chrome.

```powershell
git clone https://github.com/JanioRamalho/gerenCIA.git
cd gerenCIA
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm.cmd --prefix frontend ci
```

Escolha o banco para esta execução.

**Neon já configurado pela equipe.** O clone inclui o modelo
[`config/.env.neon`](config/.env.neon). Em um clone novo, copie esse modelo
para `.env` na raiz com `Copy-Item config/.env.neon .env`. Se já configurou
o seu `.env`, edite apenas a linha `DATABASE_URL` nele. Preencha essa
variável com a URL completa fornecida em particular para o seu usuário do
banco, preservando os parâmetros da URL. A API lê o `.env` da raiz. Para
um banco Neon que já tem o esquema, siga direto para **Como iniciar a API**.
Com a API em execução, abra `http://127.0.0.1:8000/api/health/database`
e confira se a resposta contém `"database":"connected"`.

**PostgreSQL local.** Em um clone novo, use `Copy-Item .env.example .env`.
Crie o banco local e instale o esquema e as categorias iniciais. O exemplo
usa a conta administrativa local do PostgreSQL. Informe a senha definida na
instalação quando o terminal solicitar.

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
& "$pgBin\createdb.exe" -h 127.0.0.1 -p 5432 -U postgres gerencia_db
& "$pgBin\psql.exe" -X -h 127.0.0.1 -p 5432 -U postgres -d gerencia_db -v ON_ERROR_STOP=1 -f scripts/init.sql
```

Preencha `DATABASE_URL` no `.env` com os dados do seu banco. Exemplo local:

```dotenv
APP_ENV=development
DATABASE_URL=postgresql+psycopg://postgres:SUA_SENHA@127.0.0.1:5432/gerencia_db
```

Codifique caracteres reservados da senha para uso em URLs, como `@` em `%40`.
Com o banco configurado, inicie a API e o frontend em terminais separados.

## Como iniciar a API

No PowerShell, a partir da pasta principal do projeto, execute sempre que quiser usar a API localmente:

~~~powershell
.\.venv\Scripts\python.exe -m uvicorn app.api.main:app --app-dir backend --reload
~~~

Deixe o terminal aberto enquanto usa a API. Acesse `http://127.0.0.1:8000/api/health`
para verificar o servidor, `http://127.0.0.1:8000/api/health/database` para
conferir a conexão com o banco e `http://127.0.0.1:8000/docs` para abrir a
documentação automática. Para parar o servidor, pressione Ctrl+C.

O comando usa o ambiente virtual `.venv` da pasta principal, com FastAPI e
Uvicorn instalados. A conexão com o PostgreSQL exige `DATABASE_URL` no `.env` e
o driver `psycopg`. O frontend encaminha `/api` para `http://127.0.0.1:8000`.
Defina `GERENCIA_API_URL` para usar outro endereço. Deixe a API e o frontend
em execução para testar o painel em `/app`.

## Banco de dados

O script `scripts/init.sql` cria o esquema e as categorias iniciais em um banco
PostgreSQL 18 vazio. Ele não cria o banco em si. Consulte o
[guia de instalação, atualização e testes](docs/database-setup.md).

## Como iniciar o frontend

No terminal, a partir da pasta principal do projeto, execute:

```powershell
npm.cmd --prefix frontend run dev -- --host 127.0.0.1 --port 5173
```

Abra `http://127.0.0.1:5173`. Para testar o fluxo principal, cadastre uma
conta em `/register` com nome e e-mail fictícios e uma senha de pelo menos oito
caracteres, como `senha-de-teste-1`. Importe a
[fatura fictícia de exemplo](scripts/exemplos/fatura_nubank_exemplo.csv).
O arquivo aparece no histórico e o painel mostra R$ 1.410,70 em saídas nos
dois meses. Uma segunda tentativa com o mesmo arquivo deve ser recusada.
