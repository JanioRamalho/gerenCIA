# Scripts de verificação

Estes são os scripts atuais da interface. Execute os comandos a partir da raiz
do projeto. As dependências de auditoria ficam isoladas e ignoradas pelo Git.

## Preparar as ferramentas

Com Chrome instalado, prepare Playwright e axe uma vez:

```powershell
.\.venv\Scripts\python.exe -m pip install --target .audit-tools playwright==1.63.0
npm install --prefix .audit-tools-js --no-save --package-lock=false axe-core@4.13.0
```

## Executar as verificações

Com o frontend local em execução, rode os testes atuais:

```powershell
.\.venv\Scripts\python.exe scripts/frontend/check_front_experience.py
.\.venv\Scripts\python.exe scripts/frontend/check_front_experience_a11y.py
.\.venv\Scripts\python.exe scripts/frontend/check_figures.py
.\.venv\Scripts\python.exe scripts/frontend/check_dashboard.py
```

Há também `check_auth_flow.py`, que percorre cadastro, entrada, painel (`/app`)
e saída com a API real e **cria usuários**. Rode-o apenas contra um banco descartável, nunca
o do `.env`: suba a API com um `DATABASE_URL` de teste, inicie o Vite com
`GERENCIA_API_URL` apontando para ela e passe o endereço do Vite em
`GERENCIA_TEST_URL`.

Para o percurso financeiro completo, use o runner que cria seu próprio cluster
PostgreSQL e instala `head`, sem usar o banco do `.env`:

```powershell
.\.venv\Scripts\python.exe scripts/frontend/serve_disposable_api.py
```

Em outro terminal, inicie o frontend ligado a essa API:

```powershell
$env:GERENCIA_API_URL='http://127.0.0.1:8011'
npm --prefix frontend run dev -- --host 127.0.0.1 --port 5199 --strictPort
```

E execute:

```powershell
$env:GERENCIA_TEST_URL='http://127.0.0.1:5199'
.\.venv\Scripts\python.exe scripts/frontend/check_panel_flow.py
```

Esse script só prossegue se `/api/__review_context` confirmar o banco descartável.
Ele cria conta fictícia, importa exemplos CSV/XLSX, confere totais, filtros,
correção, limites, avisos, exclusões e as cinco abas em quatro larguras com axe.
Não acrescenta rotas de revisão à aplicação de produção: essas rotas só existem
no runner local. Para encerrar, pare Vite com Ctrl+C e a API com Ctrl+C ou
`POST http://127.0.0.1:8011/api/__review_stop`; a saída do runner encerra seu cluster.

Defina `GERENCIA_TEST_URL` se o servidor não estiver em `http://127.0.0.1:5173`. As dependências locais de Playwright e axe ficam em `.audit-tools/` e `.audit-tools-js/`.

As capturas e os resultados gerados ficam em `.impeccable/review/`; não devem
ser adicionados ao Git. Para preparar o servidor local, consulte o
[README do frontend](../../frontend/README.md).
