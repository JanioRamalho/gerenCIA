# gerenCIA

O gerenCIA é uma aplicação web de gestão financeira pessoal. Quem recebe faturas e extratos em arquivos separados precisa reunir os lançamentos para descobrir quanto gastou, em que categoria e em qual mês. O sistema importa esses arquivos, organiza as transações e mostra os gastos por período. Um modelo de regressão linear usa o histórico da própria pessoa para identificar meses com despesas acima do esperado.

**[Abrir a aplicação publicada](https://gerencia-liart.vercel.app)** · [Casos de uso](#casos-de-uso) · [Instalação local](#instalação-local) · [Teste de integração da API](#teste-de-integração-da-api) · [Documentação técnica](#documentação-técnica)

## Funcionalidades

- **Demonstração pública.** A página inicial permite explorar gráficos com dados fictícios. O painel pessoal usa os arquivos da conta autenticada.
- **Importação e histórico.** Aceita faturas e extratos Nubank ou a [planilha-modelo](scripts/exemplos/planilha_modelo_exemplo.csv), em CSV ou XLSX, com até 5 MiB por arquivo. Registra linhas válidas, rejeitadas e possíveis repetições. Recusa o reenvio do mesmo conteúdo pela mesma conta.
- **Análise e revisão.** O painel mostra totais, média, mediana, evolução mensal, participação por categoria e pagamentos recorrentes. A pessoa pode pesquisar lançamentos, corrigir categorias e remover um arquivo importado.
- **Limites de gastos.** A pessoa define um teto mensal por categoria. No mês corrente, o sistema avisa ao atingir 80% e ao ultrapassar 100% do limite.
- **Perfil de gastos.** Com pelo menos quatro meses de histórico, o modelo calcula o padrão mensal e sinaliza desvios. A renda informada em **Conta** é opcional. O modelo roda em Python e dispensa chave de IA externa.

## Casos de uso

O diagrama UML mostra quem pode realizar cada ação no gerenCIA. O **visitante** pode experimentar a demonstração, criar uma conta ou entrar. Ao criar a conta ou entrar com sucesso, a pessoa passa a atuar como **usuário autenticado** e pode trabalhar com seus próprios dados financeiros.

![Diagrama UML de casos de uso do gerenCIA. O visitante acessa as três ações públicas. O usuário autenticado acessa as sete ações do painel descritas abaixo.](docs/casos-de-uso.svg)

| Caso de uso | Como acontece no sistema |
| --- | --- |
| Explorar a demonstração | Na página inicial, o visitante escolhe um período e consulta gráficos com dados fictícios. |
| Criar conta | O visitante informa nome completo, e-mail e senha. Se o cadastro for válido e o e-mail estiver disponível, o sistema cria a conta e inicia a sessão. |
| Entrar na conta | O visitante informa e-mail e senha. Credenciais válidas abrem o painel. Em caso de erro, o sistema exibe uma mensagem e mantém o visitante fora da conta. |
| Importar fatura ou extrato | Em **Arquivos**, a pessoa envia um CSV ou XLSX. O sistema registra o resultado do processamento e disponibiliza os lançamentos válidos para análise. O reenvio de conteúdo idêntico é recusado. |
| Consultar histórico de arquivos | Em **Arquivos**, a pessoa confere os arquivos enviados e os resultados de cada importação. Se remover um arquivo, os lançamentos associados também são removidos. |
| Analisar gastos | Em **Painel**, a pessoa seleciona o período e consulta totais e categorias. Com histórico suficiente, o cartão de perfil de gastos também indica meses acima do padrão. |
| Revisar transações | Em **Transações**, a pessoa pesquisa um lançamento e pode corrigir sua categoria. A alteração é refletida na análise dos gastos. |
| Gerenciar limites mensais | Em **Limites**, a pessoa escolhe o mês e a categoria, define ou altera o teto e acompanha o valor utilizado. Também pode remover o limite. |
| Consultar avisos de limite | Pelo sino do painel, a pessoa consulta os avisos gerados quando os gastos do mês corrente atingem 80% ou ultrapassam 100% do limite e pode marcá-los como lidos. |
| Atualizar renda mensal | Em **Conta**, a pessoa informa, altera ou remove a renda mensal usada para contextualizar seu perfil de gastos. |

## Instalação local

Os comandos abaixo usam **Windows e PowerShell**. Instale Git, **Python 3.14** e **Node.js 22 com npm**. Para usar o banco local ou executar os testes de integração, instale também **PostgreSQL 18** com as ferramentas de linha de comando. Para usar o banco Neon já preparado, basta a URL de conexão fornecida pela equipe.

### 1. Baixar o projeto e instalar as dependências

```powershell
git clone https://github.com/JanioRamalho/gerenCIA.git
cd gerenCIA
```

Se você já clonou o projeto, abra a pasta que contém `README.md`, `backend` e `frontend`. No VS Code, use **Terminal → Novo Terminal** nessa pasta. Execute os comandos a partir dela.

```powershell
py -3.14 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm.cmd --prefix frontend ci
```

Se o comando `py` estiver indisponível, confira `python --version`. Se ele mostrar Python 3.14, use `python -m venv .venv` na primeira linha. Os comandos deste guia chamam o Python de `.venv` diretamente.

### 2. Escolher o banco de dados

Escolha **uma** das opções. O PostgreSQL local permite executar o projeto do zero com os arquivos do repositório. O Neon conecta a aplicação a um banco existente.

#### Opção A — PostgreSQL local

Com o serviço PostgreSQL em execução, rode os comandos abaixo para criar um **banco novo e vazio** e instalar as tabelas, os relacionamentos e as categorias iniciais. Ajuste `$pgBin` se instalou o PostgreSQL em outra pasta. Quando solicitado, informe a senha definida na instalação para o usuário `postgres`.

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
& "$pgBin\createdb.exe" -h 127.0.0.1 -p 5432 -U postgres gerencia_db
& "$pgBin\psql.exe" -X -h 127.0.0.1 -p 5432 -U postgres -d gerencia_db -v ON_ERROR_STOP=1 -f scripts/init.sql
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

No `.env` da raiz, ajuste as duas linhas abaixo. Substitua `SUA_SENHA` pela senha local. Na URL, um caractere reservado como `@` na senha deve ser escrito como `%40`. Salve o arquivo. Para atualizar um banco de uma versão anterior, consulte o [guia de migrações](docs/database-setup.md).

```dotenv
APP_ENV=development
DATABASE_URL=postgresql+psycopg://postgres:SUA_SENHA@127.0.0.1:5432/gerencia_db
```

#### Opção B — Neon com o banco da equipe já preparado

Obtenha em particular a URL de conexão do seu usuário autorizado. O arquivo [config/.env.neon](config/.env.neon) é o modelo público. Estes comandos criam a cópia local, caso precise dela, e abrem o arquivo que a API lê:

```powershell
if (!(Test-Path .env)) { Copy-Item .\config\.env.neon .env }
notepad .env
```

Mantenha `APP_ENV=development` para rodar a API no seu computador. Cole a URL completa depois de `DATABASE_URL=`, em uma única linha, incluindo os parâmetros após `?`. Salve com **Ctrl+S**. A URL contém uma senha e deve ficar apenas na sua configuração privada. Como o banco da equipe já tem o esquema, siga para a inicialização da API.

## Como iniciar a API

No **primeiro terminal**, na pasta do projeto, execute:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.api.main:app --app-dir backend --reload
```

Deixe o terminal aberto. Confira estes endereços no navegador:

| Endereço local | Resultado esperado |
| --- | --- |
| [Saúde da API](http://127.0.0.1:8000/api/health) | `{"status":"ok"}` confirma que a API responde. |
| [Conexão com o banco](http://127.0.0.1:8000/api/health/database) | `{"status":"ok","database":"connected"}` confirma que a API conseguiu consultar o PostgreSQL configurado. |
| [Documentação interativa da API](http://127.0.0.1:8000/docs) | Rotas, parâmetros e respostas disponíveis no Swagger. |

Se o teste do banco retornar `503`, confira a `DATABASE_URL` no `.env` da raiz e a disponibilidade do banco escolhido. Reinicie a API após editar o arquivo. Use **Ctrl+C** para encerrar o servidor.

## Como iniciar o frontend

Abra um **segundo terminal** na mesma pasta e execute:

```powershell
npm.cmd --prefix frontend run dev -- --host 127.0.0.1 --port 5173
```

Abra [o site local](http://127.0.0.1:5173) ou o endereço `Local` indicado pelo Vite. Mantenha os dois terminais abertos. O Vite encaminha as chamadas `/api` para `http://127.0.0.1:8000`. Se a sua API usar outro endereço, defina `$env:GERENCIA_API_URL` no terminal do frontend antes de iniciar o Vite.

## Como testar o projeto pela interface

1. **Criar uma conta de teste.** Abra [Cadastro](http://127.0.0.1:5173/register). Use nome e sobrenome fictícios, um e-mail de teste ainda livre e uma senha de pelo menos oito caracteres. As credenciais para entrar novamente são as que você acabou de cadastrar.
2. **Importar uma fatura.** Em **Arquivos**, selecione a [fatura fictícia de julho e agosto de 2026](scripts/exemplos/fatura_nubank_exemplo.csv) e envie. Ela deve aparecer no histórico. Envie o mesmo arquivo de novo para conferir a mensagem de arquivo já enviado.
3. **Conferir o resultado.** Em uma conta nova, com apenas essa fatura, abra **Painel → Período → Todos os meses**. O total de saídas esperado é **R$ 1.410,70**. Em **Transações**, procure por `Netflix` e confira os lançamentos dos dois meses.
4. **Revisar uma categoria e criar um limite.** Altere a categoria de um lançamento e confira a mudança ao voltar ao painel. Em **Limites**, defina um valor para uma categoria e mês. Consulte o valor usado e o saldo do limite na tela.
5. **Demonstrar a IA.** Em uma conta de teste sem importações anteriores, envie o [histórico fictício de 11 meses](scripts/exemplos/ia/historico_11_meses.csv) e depois a [fatura de novembro com gasto atípico](scripts/exemplos/ia/fatura_nov_2026_anomala.csv). Volte ao **Painel** e confira novembro de 2026 no cartão **Perfil de gastos**.

## Teste de integração da API

Este teste inicia a API e um PostgreSQL temporário, cria uma conta por HTTP, confere a resposta `201` e consulta a tabela `users` para verificar se o e-mail foi gravado. Ele usa os executáveis locais do PostgreSQL 18 e pode ser executado com os servidores da aplicação desligados. Na raiz do projeto, rode:

```powershell
.\.venv\Scripts\python.exe backend/tests/rodar_teste.py backend/tests/test_server.py::test_servidor_inicia_e_atende_api_com_postgresql --codigo
```

O comando exibe o código do teste e o resultado do pytest. Procure **`PASSED`** ao lado do nome do teste e **`1 passed`** no resumo. Para uma demonstração manual com a API em execução, use o [roteiro interativo](docs/testes.md#casos-básicos-para-a-banca).

### Outras verificações

| O que verificar | Comando na raiz |
| --- | --- |
| Suíte completa do backend, incluindo testes unitários, API, banco e servidor | `.\.venv\Scripts\python.exe backend/tests/rodar_todos.py` |
| Somente os testes unitários | `.\.venv\Scripts\python.exe -m pytest -v -m unit` |
| Escolher um teste e mostrar seu código | `.\.venv\Scripts\python.exe backend/tests/rodar_teste.py --codigo` |
| Demonstrar o perfil de gastos com dados fictícios | `.\.venv\Scripts\python.exe scripts/demonstrar_ia.py` |
| Gerar a versão de produção do frontend | `npm.cmd --prefix frontend run build` |

Se o pytest solicitar os executáveis do PostgreSQL, defina `$env:GERENCIA_PG_BIN` com o caminho da pasta `bin` da instalação. Os [testes no navegador](scripts/frontend/README.md) usam Chrome, Playwright e um banco descartável para os fluxos que criam registros. O [guia de testes](docs/testes.md) detalha os casos de sucesso e de erro esperado, incluindo login e importação.

### Resultado do ensaio de instalação

Em 27/11/2026, um clone novo no Windows, com dependências instaladas do zero e PostgreSQL descartável, passou nos **239 testes do backend** e compilou o frontend. Pelo endereço local do Vite, foram verificados a conexão com o banco, o cadastro, a importação da fatura de exemplo, a recusa do reenvio e o total de **R$ 1.410,70** devolvido pela API do painel.

## Arquitetura e estrutura do projeto

O navegador usa **React, TypeScript, Vite e Recharts**. A **API FastAPI** autentica a sessão, recebe o arquivo e usa **pandas** para converter as linhas em transações ou rejeições. **SQLAlchemy e psycopg** fazem a persistência no **PostgreSQL**. O painel consulta a API para obter as métricas da conta. A configuração de publicação da interface e da API na Vercel está em [vercel.json](vercel.json).

| Local | Conteúdo |
| --- | --- |
| [frontend/src/](frontend/src/) | Páginas, componentes, gráficos e consultas à API. |
| [backend/app/](backend/app/) | Rotas, validação, serviços, repositórios, modelos, processamento financeiro e IA. |
| [scripts/init.sql](scripts/init.sql) e [scripts/migrations/](scripts/migrations/) | Instalação do esquema, carga inicial e atualizações do banco. |
| [backend/tests/](backend/tests/) e [scripts/frontend/](scripts/frontend/) | Testes automatizados e roteiros de navegador. |
| [scripts/exemplos/](scripts/exemplos/) | Faturas fictícias, planilha-modelo e histórico para demonstração. |
| [docs/](docs/) | Documentação técnica, requisitos, planejamento e critérios da A3. |

### Requisitos que podem ser demonstrados à banca

| Requisito | Como verificar |
| --- | --- |
| Importar o arquivo e consultar o resultado por período (funcional) | Execute o roteiro da fatura acima. O [teste de importação](backend/tests/test_uploads.py) também confere transações, rejeições e totais. |
| Alterar a categoria de um lançamento e acompanhar limites (funcional) | Abra **Transações** e **Limites**. Os [testes do painel](backend/tests/test_panel.py) verificam a alteração de categoria, o gasto líquido e os avisos. |
| Isolar os dados de cada conta (segurança) | O [teste de histórico e remoção](backend/tests/test_uploads.py) usa duas contas e verifica que uma pessoa só acessa e remove os próprios arquivos. |
| Manter os registros consistentes quando a importação falha (integridade) | A importação grava o arquivo e seus resultados em uma transação do banco. O [teste de falha na gravação](backend/tests/test_uploads.py) verifica que um erro desfaz a operação inteira. |

## Documentação técnica

- [Arquitetura e fluxo de dados](docs/arquitetura.md) e [referência do backend](backend/README.md).
- [Instalação, modelo e migrações do banco](docs/database-setup.md).
- [Planejamento, requisitos e critérios de aceite](docs/planejamento-gerencia.txt) e [comparação com a entrega A3](docs/a3.md).
- [Tratamento dos arquivos e estatística](docs/analise-de-dados.md) e [modelo de regressão para o perfil de gastos](docs/ia-perfil-de-gastos.md).
- [Interface e rotas](frontend/README.md) e [cenários de teste](docs/testes.md).

**Escopo desta versão.** O perfil de gastos usa regressão linear local. O planejamento inclui ideias para versões posteriores, como conversa com IA, calendário de cobranças e notificações por e-mail. A repetição de conteúdo idêntico é bloqueada por arquivo. Com extratos diferentes que cobrem o mesmo período, pode haver dupla contagem.
