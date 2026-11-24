# Comandos de teste no terminal

Use o PowerShell na raiz do GerenCIA, com o ambiente virtual `.venv` preparado. [Instalação local](../../README.md#instalação-local)

## Digitar entradas no terminal

Estes seis comandos rodam sem API ou banco. Execute um por vez e digite o exemplo quando o terminal pedir. A opção `--codigo` mostra os testes correspondentes. A demonstração imprime `PASSED` quando aceita o valor e `FAILED` quando o recusa.

### E-mail

```powershell
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py email --codigo
```

Digite `conta@exemplo.test` para ver um e-mail aceito. Repita com `conta.exemplo.test` ou `conta@exemplo` para ver a recusa.

### Senha

```powershell
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py senha --codigo
```

Digite `12345678` para ver a senha aceita e `1234567` para ver a recusa. O terminal oculta os caracteres enquanto você digita. Pressione Enter para enviar.

### Nome e sobrenome

```powershell
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py nome --codigo
```

Digite `Ana Silva` para ver um nome aceito e `Ana` para ver a recusa por falta de sobrenome.

### Valor de uma compra na fatura

```powershell
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py fatura --codigo
```

Digite `0,01` para ver a linha da fatura de exemplo entrar como compra. Com `0`, o valor é lido e a linha fica fora das compras. Com `abc`, o valor é recusado.

### Data de uma fatura

```powershell
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py data --codigo
```

Digite `15/06/2026` para ver uma data aceita e `31/02/2026` para ver a recusa.

### Número da parcela

```powershell
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py parcela --codigo
```

Digite `2/5` para ver a parcela aceita e `7/5` para ver a recusa por ultrapassar o total.

## Ver o perfil de gastos com faturas fictícias

O primeiro comando mostra o perfil de gastos e sinaliza o mês fora do padrão. O segundo roda com o histórico normal. Os dois leem as faturas de exemplo localmente.

```powershell
.\.venv\Scripts\python.exe scripts/demonstrar_ia.py
.\.venv\Scripts\python.exe scripts/demonstrar_ia.py --sem-anomalia
```

## Fazer tentativas pela API local

Em outro terminal, inicie a API com o `.env` da instalação local. A prévia usa `APP_ENV=development`. [Configuração da API](../../README.md#como-iniciar-a-api)

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.api.main:app --app-dir backend --reload
```

A porta padrão é `8000`. Na prévia e na saúde do servidor, pressione Enter quando o script pedir a porta para usar esse valor.

### Prévia de fatura pela API

```powershell
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py api --codigo
```

Use `fatura.csv` como nome para ver a prévia retornar HTTP `200` com R$ 25,00 em compras. Repita com `fatura.pdf` para ver a recusa com HTTP `422`. O script gera os dados da fatura de exemplo.

### Saúde do servidor

```powershell
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py servidor --codigo
```

Com a API em execução na porta informada, a resposta esperada é HTTP `200` com `{"status":"ok"}`.

### Login

```powershell
.\.venv\Scripts\python.exe scripts/verificar_login.py
```

Digite as credenciais de uma conta fictícia cadastrada no banco local para ver o login aceito. Repita com uma senha incorreta ou um e-mail sem conta para ver a recusa. Se a API estiver em outra porta, acrescente `--porta` seguido do número.

## Rodar um teste automatizado por vez

Abra o menu, escolha o arquivo e depois o caso. O script mostra o código do teste escolhido e executa aquele caso. Digite `0` para sair.

```powershell
.\.venv\Scripts\python.exe backend/tests/rodar_teste.py --codigo
```

Para ir direto a um teste, passe o identificador completo. Este caso passa quando a validação recusa o e-mail sem arroba.

```powershell
.\.venv\Scripts\python.exe backend/tests/rodar_teste.py 'backend/tests/test_validacao_cadastro.py::test_cadastro_rejeita_email_sem_arroba' --codigo
```

Para encontrar o identificador de qualquer caso unitário, liste os casos com o comando abaixo e copie a linha desejada. Mantenha as aspas simples ao passar o identificador, inclusive quando ele termina com uma variação entre colchetes.

```powershell
.\.venv\Scripts\python.exe -m pytest --collect-only -q -m unit
```

Para rodar os testes de um assunto de uma vez, use a linha correspondente.

```powershell
# E-mail e senha do cadastro
.\.venv\Scripts\python.exe -m pytest -v backend/tests/test_validacao_cadastro.py -k "email or senha"

# Nome, e-mail e senha do cadastro
.\.venv\Scripts\python.exe -m pytest -v backend/tests/test_validacao_cadastro.py

# Login com consulta simulada
.\.venv\Scripts\python.exe -m pytest -v backend/tests/test_login_unitario.py

# Hash da senha e tokens de sessão
.\.venv\Scripts\python.exe -m pytest -v backend/tests/test_security.py

# Faturas, datas, parcelas, valores e análise financeira
.\.venv\Scripts\python.exe -m pytest -v backend/tests/test_previa_fatura.py

# Perfil de gastos e detecção de anomalias
.\.venv\Scripts\python.exe -m pytest -v backend/tests/test_ai_perfil.py

# Todos os testes unitários
.\.venv\Scripts\python.exe -m pytest -v -m unit
```
