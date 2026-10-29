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

As partes comuns (endereço testado, tamanhos de tela, erros de página, axe e
bloqueio do `localStorage`) ficam em `helpers.py`.

Há também `check_auth_flow.py`, que percorre cadastro, entrada, painel (`/app`)
e saída com a API real e **cria usuários**. Rode-o apenas contra um banco descartável, nunca
o do `.env`: suba a API com um `DATABASE_URL` de teste, inicie o Vite com
`GERENCIA_API_URL` apontando para ela e passe o endereço do Vite em
`GERENCIA_TEST_URL`.

Defina `GERENCIA_TEST_URL` se o servidor não estiver em `http://127.0.0.1:5173`. As dependências locais de Playwright e axe ficam em `.audit-tools/` e `.audit-tools-js/`.

As capturas e os resultados gerados ficam em `.impeccable/review/`; não devem
ser adicionados ao Git. Para preparar o servidor local, consulte o
[README do frontend](../../frontend/README.md).
