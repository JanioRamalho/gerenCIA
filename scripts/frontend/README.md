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

Os roteiros de autenticação e financeiro criam usuários fictícios e usam a API
real. Prepare um banco PostgreSQL vazio e descartável seguindo o
[guia do banco](../../docs/database-setup.md#instalação-nova), com um nome como
`gerencia_teste_navegador`. Inicie a API com `DATABASE_URL` apontando para esse
banco e deixe o Vite encaminhar as requisições para essa API. Se usar portas
diferentes das indicadas no README, configure `GERENCIA_API_URL` no terminal
do Vite e `GERENCIA_TEST_URL` no terminal dos testes.

```powershell
.\.venv\Scripts\python.exe scripts/frontend/check_auth_flow.py
.\.venv\Scripts\python.exe scripts/frontend/check_finance_flow.py
```

Defina `GERENCIA_TEST_URL` se o servidor não estiver em `http://127.0.0.1:5173`. As dependências locais de Playwright e axe ficam em `.audit-tools/` e `.audit-tools-js/`.

As capturas e os resultados gerados ficam em `.impeccable/review/`; não devem
ser adicionados ao Git. Para preparar o servidor local, consulte o
[README do frontend](../../frontend/README.md).
