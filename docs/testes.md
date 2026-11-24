# Testes do GerenCIA

Execute os comandos a partir da raiz, com o ambiente do [README](../README.md).
O pytest apresenta o resultado de cada caso com `-v`. A suíte completa
inicia seus próprios processos e usa PostgreSQL descartável em `127.0.0.1`.

## Rodar tudo ou escolher um caso

```powershell
.\.venv\Scripts\python.exe backend/tests/rodar_todos.py
.\.venv\Scripts\python.exe backend/tests/rodar_teste.py --codigo
```

`rodar_todos.py` executa os testes unitários e de integração do backend,
incluindo API, PostgreSQL e servidor HTTP. `rodar_teste.py` pede o número
do arquivo e depois o número do caso, incluindo entradas de testes
parametrizados. Use `0` para sair e `--codigo` para exibir o teste escolhido.

Para ir direto a um caso automatizado ou digitar uma entrada na demonstração:

```powershell
.\.venv\Scripts\python.exe backend/tests/rodar_teste.py backend/tests/test_server.py::test_saude_do_servidor_retorna_ok --codigo
.\.venv\Scripts\python.exe backend/tests/rodar_teste.py email --codigo
```

As opções de demonstração são `nome`, `email`, `senha`, `fatura`, `data`,
`parcela`, `api` e `servidor`. Para as duas últimas, a API local deve estar
rodando. Os testes automatizados sobem o servidor quando precisam dele.

## Executar por camada

| Camada | O que verifica | Opções para `.\.venv\Scripts\python.exe -m pytest` |
| --- | --- | --- |
| Completa | Todos os casos automatizados do backend | `-v` |
| Unitária | Login, senhas e tokens, leitura, datas, valores, categorias e estatística | `-v -m unit` |
| API sem banco | Prévia, limites do corpo HTTP e recusa de requisições sem sessão | `-v -m "api and not database and not server"` |
| API com banco | Autenticação, arquivos, painel, transações, limites e avisos | `-v -m "api and database and not server"` |
| Banco via SQL | Integridade, relacionamentos, códigos e migrações | `-v -m "database and not api"` |
| Servidor HTTP | Uvicorn pela rede, conexão com PostgreSQL e resposta à indisponibilidade | `-v -m server` |

Os executáveis `initdb`, `pg_ctl` e `psql` são encontrados no `PATH`, na
instalação padrão do PostgreSQL 18 no Windows ou na pasta indicada por
`GERENCIA_PG_BIN`. A suíte cria o próprio banco a partir de `scripts/init.sql`.
O [guia do banco](database-setup.md#testes-isolados) detalha a configuração.

Na execução de 23/11/2026, os **238 casos** passaram. Foram 81 unitários,
19 da API sem banco, 33 da API com banco, 102 de integridade e migrações via
SQL e 3 do servidor HTTP. A medição anterior no processo pytest registrou
**96% das linhas de `backend/app`**. Os testes HTTP do Uvicorn são executados
em subprocesso e os roteiros do frontend são executados no Chrome.

Para salvar a execução em um relatório JUnit:

```powershell
.\.venv\Scripts\python.exe -m pytest -v --junitxml=.impeccable/review/pytest.xml
```

## Cenários de sucesso e de erro esperado

Um cenário negativo passa quando o sistema recusa a operação da maneira
esperada. Ao tentar entrar com uma conta inexistente, a API deve responder
`401`, devolver a mesma mensagem usada para senha errada e manter o usuário
sem sessão. Uma resposta diferente da esperada gera uma falha no pytest.

### Demonstrar uma tentativa de login no terminal

Com a [API local em execução](../README.md#como-iniciar-a-api), rode o comando
abaixo e informe o e-mail e a senha. Use uma conta fictícia cadastrada no
GerenCIA. O comando mostra `PASSED - Login aceito.` e encerra a sessão criada.
Rode novamente com um e-mail fictício sem cadastro para ver
`FAILED - E-mail ou senha incorretos.` Se a API usar outra porta, passe
`--porta` seguido do número.

```powershell
.\.venv\Scripts\python.exe scripts/verificar_login.py
```

### Resultados esperados na suíte automatizada

| Fluxo | Sucesso | Erro esperado ou limite verificado | Código |
| --- | --- | --- | --- |
| Cadastro e sessão | Cria a conta, entrega cookie e permite consultar a sessão | Campos inválidos `422`, e-mail repetido `409`, sessão expirada `401` | [Autenticação](../backend/tests/test_auth.py) |
| Login e saída | Credenciais válidas abrem sessão e sair a revoga no banco | Conta inexistente e senha errada recebem o mesmo `401` | [Autenticação](../backend/tests/test_auth.py) |
| Leitura e análise | Lê CSV e XLSX, padroniza valores e calcula média, mediana e totais | Data inválida tem motivo de rejeição, arquivo inválido é recusado | [Pipeline](../backend/tests/test_previa_fatura.py) |
| Prévia e rotas financeiras | Prévia devolve análise JSON | Tamanho acima do limite `413`, formato inválido `422`, acesso sem sessão `401` | [API](../backend/tests/test_api.py) |
| Arquivos e histórico | Importação grava transações, rejeições e qualidade, removendo os registros ao excluir o arquivo | Reenvio `409`, arquivo de outra conta `404`, contagem incoerente desfaz gravação | [Arquivos](../backend/tests/test_uploads.py) |
| Painel e categorias | Filtros, paginação e correção de categoria com regra futura | Outra conta não pode alterar a transação | [Painel](../backend/tests/test_panel.py) |
| Limites e notificações | Gasto líquido, limites mensais e aviso único na faixa de 80% e ao passar de 100% | Limite inválido `422`, leitura controlada pela sessão, avisos isolados por conta | [Painel](../backend/tests/test_panel.py) |
| Perfil de gastos (IA) e renda | Regressão linear do zero (igual ao `numpy.polyfit`), perfil de 12 meses detecta anomalia em nov/2026, renda salva/removida via `PATCH /api/auth/me` | Menos de 4 meses não treina, mês econômico e variação mínima não geram falso alerta, renda `<= 0` recebe `422`, acesso sem sessão recebe `401` | [IA unitário](../backend/tests/test_ai_perfil.py) e [IA API](../backend/tests/test_ai_api.py) |
| Banco | Instalação, atualizações de integridade e geração de códigos | Parcela inválida, categoria de outra conta, renda não positiva e duplicata estrutural são rejeitadas | [Integridade](../backend/tests/test_database_integrity.py) e [códigos](../backend/tests/test_display_codes.py) |
| Servidor | Healthcheck e cadastro por HTTP com PostgreSQL | Healthcheck do banco retorna `503` quando ele está indisponível | [Servidor](../backend/tests/test_server.py) |

### Casos básicos para a banca

Para rodar todos os testes unitários e ver o resultado de cada um, use:

```powershell
.\.venv\Scripts\python.exe -m pytest -v -m unit
```

O [demonstrador](../backend/tests/demonstrar_testes.py) fica em `backend/tests/`.
Os comandos pedem uma entrada no terminal e mostram `PASSED` ou `FAILED`
para aquela tentativa. `--codigo` exibe os testes relevantes e, para os
campos do cadastro, a função de validação usada pelo GerenCIA.

```powershell
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py nome --codigo
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py email --codigo
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py senha --codigo
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py fatura --codigo
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py data --codigo
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py parcela --codigo
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py api --codigo
.\.venv\Scripts\python.exe backend/tests/demonstrar_testes.py servidor --codigo
```

| Comando | Entrada aceita | Entrada recusada |
| --- | --- | --- |
| `nome` | `Ana Silva`, com nome e sobrenome | `AnaSilva`, sem espaço, ou `Ana`, sem sobrenome |
| `email` | `conta@exemplo.test`, com `@` e ponto no domínio | `conta.exemplo.test`, sem `@`, ou `conta@exemplo`, sem ponto no domínio |
| `senha` | `12345678`, com oito caracteres | `1234567`, com sete caracteres. O terminal mostra o comprimento e mantém a senha oculta |
| `fatura` | `0,01`, que entra como compra | `0` fica fora das compras. `abc` é rejeitado como valor |
| `data` | `15/06/2026`, uma data válida | `31/02/2026`, que não existe |
| `parcela` | `2/5`, segunda parcela de cinco | `7/5`, porque a parcela atual supera o total |
| `api` | `fatura.csv` recebe `200` na rota de prévia | `fatura.pdf` recebe `422` porque o formato é inválido |
| `servidor` | A porta da API em execução recebe `200` e `{"status":"ok"}` | Uma porta sem serviço mostra que a API está indisponível |

Você também pode usar o atalho `scripts/demonstrar_testes.py` com as mesmas
opções.

Para `api` e `servidor`, [inicie a API local](../README.md#como-iniciar-a-api)
e pressione Enter quando o comando pedir a porta para usar `8000`. O exemplo
de API envia um CSV fictício para análise, sem gravar uma importação.

### Rodar os casos básicos no pytest

Os testes de cadastro conferem nome e sobrenome, o mínimo de oito caracteres
para a senha e a presença de `@` e ponto no domínio do e-mail. Os testes da
fatura usam um centavo, zero, um valor negativo e texto. Só o valor positivo
entra como compra. O
valor negativo continua disponível para movimentos como estorno, e o texto
gera uma rejeição da linha.

```powershell
.\.venv\Scripts\python.exe -m pytest -v backend/tests/test_validacao_cadastro.py
.\.venv\Scripts\python.exe -m pytest -v backend/tests/test_previa_fatura.py -k 'fatura_compra_exige_valor_positivo or fatura_rejeita_valor_nao_numerico'
```

Os dois casos de integração mostram respostas HTTP. O primeiro envia um
cadastro com e-mail sem `@` e senha curta e espera `422` com os dois erros.
O segundo inicia um Uvicorn temporário e espera `200` e `{"status":"ok"}`
de `/api/health`.

```powershell
.\.venv\Scripts\python.exe -m pytest -v backend/tests/test_api.py::test_api_rejeita_email_sem_arroba_e_senha_curta_no_cadastro
.\.venv\Scripts\python.exe -m pytest -v backend/tests/test_server.py::test_saude_do_servidor_retorna_ok
```

Para a banca, rode os dois testes unitários do login. Eles chamam a mesma
função usada pela API e simulam a consulta de conta. O primeiro espera
`InvalidCredentials` para a conta inexistente. O segundo confere se a função
devolve a conta cadastrada quando a senha está correta. Os dois aparecem
como `PASSED` quando o sistema segue essas regras.

```powershell
.\.venv\Scripts\python.exe -m pytest -v backend/tests/test_login_unitario.py
```

Para mostrar o login completo pela API, com PostgreSQL temporário e cookie
de sessão, rode os testes de integração abaixo.

```powershell
.\.venv\Scripts\python.exe -m pytest -v backend/tests/test_auth.py -k 'right_credentials or unknown_email'
```

## No navegador

Use os [roteiros Playwright](../scripts/frontend/README.md). O roteiro de
autenticação confirma cadastro, login válido, recusa de conta inexistente,
saída, navegação móvel e o comportamento quando a API fica inacessível. O
financeiro cria um limite, importa uma fatura, confere o painel e as transações,
testa a recusa do reenvio, lê o aviso no sininho e remove a fatura. Ambos criam
contas fictícias em um banco descartável configurado para a execução.

Os seis roteiros Playwright passaram em 23/11/2026 com o Chrome, o Vite,
o Uvicorn e um PostgreSQL descartável.

O [checklist A3](a3.md) registra os requisitos acadêmicos e as evidências de
validação.
