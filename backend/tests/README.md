# Testes do GerenCIA

Rode os comandos no PowerShell, a partir da raiz do repositório, com o
ambiente virtual preparado conforme a [instalação local](../../README.md#instalação-local).

Os [comandos de teste no terminal](COMANDOS_TERMINAL.md) reúnem as demonstrações
com entradas de exemplo e os atalhos para rodar um caso por vez.

```powershell
$testPython = '.\.venv\Scripts\python.exe'
```

## Rodar a suíte completa do backend

```powershell
.\.venv\Scripts\python.exe backend/tests/rodar_todos.py
```

O pytest mostra `PASSED`, `FAILED` ou `ERROR` para cada caso e imprime o
resumo no fim. O resultado esperado é que todos os casos passem, com código
de saída `0`. Um teste que espera a rejeição de um e-mail sem `@` aparece
como `PASSED` quando a rejeição acontece.

A suíte inclui testes unitários, contratos da API, integração com PostgreSQL
e servidor HTTP. Ela sobe o banco temporário e o Uvicorn quando precisa
deles. Os executáveis do PostgreSQL são procurados no `PATH`, na instalação
padrão do PostgreSQL 18 no Windows ou no caminho indicado por
`GERENCIA_PG_BIN`. Para os testes no Chrome, siga o
[README dos roteiros Playwright](../../scripts/frontend/README.md).

## Digitar exemplos no terminal

Execute o comando do cenário, digite uma entrada e pressione Enter. Rode o
mesmo comando novamente para comparar a entrada aceita com a recusada.
O demonstrador mostra `PASSED` para entrada aceita e `FAILED` para entrada
recusada. Com `--codigo`, ele também exibe os testes correspondentes.

```powershell
& $testPython backend/tests/demonstrar_testes.py nome --codigo
& $testPython backend/tests/demonstrar_testes.py email --codigo
& $testPython backend/tests/demonstrar_testes.py senha --codigo
& $testPython backend/tests/demonstrar_testes.py fatura --codigo
& $testPython backend/tests/demonstrar_testes.py data --codigo
& $testPython backend/tests/demonstrar_testes.py parcela --codigo
```

| Cenário | Digite para aceitar | Digite para recusar |
| --- | --- | --- |
| Nome | `Ana Silva` | `Ana` ou `AnaSilva` |
| E-mail | `conta@exemplo.test` | `conta.exemplo.test` ou `conta@exemplo` |
| Senha | `12345678` | `1234567` |
| Fatura | `0,01` entra como compra | `0` fica fora das compras. `abc` é rejeitado como valor. |
| Data | `15/06/2026` | `31/02/2026` |
| Parcela | `2/5` | `7/5` |

### Login, prévia da API e saúde do servidor

Para tentar esses três fluxos manualmente, inicie a [API local](../../README.md#como-iniciar-a-api)
em outro terminal. Para o login, use uma conta fictícia cadastrada no banco local.

```powershell
& $testPython scripts/verificar_login.py
& $testPython backend/tests/demonstrar_testes.py api --codigo
& $testPython backend/tests/demonstrar_testes.py servidor --codigo
```

| Cenário | Tentativa aceita | Tentativa recusada |
| --- | --- | --- |
| Login | E-mail cadastrado e senha correta | Mesmo e-mail com senha errada ou e-mail sem conta. A API responde `401`. |
| Prévia da API | `fatura.csv` na porta da API. A API responde `200`. | `fatura.pdf` na mesma porta. A API responde `422`. |
| Saúde do servidor | Porta com a API em execução. Retorna `200` e `{"status":"ok"}`. | Porta sem servidor. O terminal informa que a API não respondeu. |

A porta padrão é `8000`. O script de login aceita `--porta` para escolher
outra porta. A prévia e a saúde perguntam a porta no terminal.

## Rodar um teste unitário por vez

Cada linha abaixo executa um caso, inclusive quando a mesma função tem
várias entradas. Mantenha as aspas simples ao copiar o identificador com
colchetes. Para listar os casos disponíveis, abrir o menu interativo com
código ou rodar todos os unitários, use os comandos correspondentes abaixo.

```powershell
& $testPython -m pytest --collect-only -q -m unit
& $testPython backend/tests/rodar_teste.py --codigo
& $testPython -m pytest -v -m unit
```

### Login

```powershell
& $testPython -m pytest -v 'backend/tests/test_login_unitario.py::test_login_recusa_conta_inexistente'
& $testPython -m pytest -v 'backend/tests/test_login_unitario.py::test_login_aceita_conta_cadastrada_com_senha_correta'
```

### E-mail

```powershell
& $testPython -m pytest -v 'backend/tests/test_validacao_cadastro.py::test_cadastro_aceita_email_com_arroba_e_dominio'
& $testPython -m pytest -v 'backend/tests/test_validacao_cadastro.py::test_cadastro_rejeita_email_sem_arroba'
& $testPython -m pytest -v 'backend/tests/test_validacao_cadastro.py::test_cadastro_rejeita_email_sem_ponto_no_dominio'
```

### Senha

```powershell
& $testPython -m pytest -v 'backend/tests/test_validacao_cadastro.py::test_cadastro_aceita_senha_com_oito_caracteres'
& $testPython -m pytest -v 'backend/tests/test_validacao_cadastro.py::test_cadastro_rejeita_senha_com_sete_caracteres'
```

### Nome e sobrenome

```powershell
& $testPython -m pytest -v 'backend/tests/test_validacao_cadastro.py::test_cadastro_aceita_nome_com_sobrenome'
& $testPython -m pytest -v 'backend/tests/test_validacao_cadastro.py::test_cadastro_rejeita_nome_sem_sobrenome[sem-separador]'
& $testPython -m pytest -v 'backend/tests/test_validacao_cadastro.py::test_cadastro_rejeita_nome_sem_sobrenome[apenas-primeiro-nome]'
```

### Datas e parcelas

```powershell
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_data[15/06/2026-2026-06-15]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_data[2026-06-15-2026-06-15]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_data[2026-06-15 00:00:00-2026-06-15]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_data[46188-2026-06-15]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_data[31/02/2026-None]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_data[-None]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_parcela_info[Mercadolivre*Fone - Parcela 2/5-esperado0]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_parcela_info[Loja Central 03/12-esperado1]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_parcela_info[Posto 31/12-None]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_parcela_info[Parcela 7/5-None]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_parcela_info[Netflix.Com-None]'
```

### Faturas e formatos de arquivo

```powershell
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_fatura_compra_exige_valor_positivo[um-centavo]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_fatura_compra_exige_valor_positivo[zero]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_fatura_compra_exige_valor_positivo[estorno]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_fatura_rejeita_valor_nao_numerico'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_fatura_nubank_exemplo'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_planilha_modelo_rejeita_com_motivo'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_csv_latin1_com_ponto_e_virgula_e_cabecalho_de_outro_banco'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_xlsx'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_arquivo_invalido[-vazio.csv]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_arquivo_invalido[texto solto sem colunas-sem_colunas.csv]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_arquivo_invalido[a,b\n1,2-colunas_desconhecidas.csv]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_arquivo_invalido[data,descricao,valor\n01/01/2026,x,1,00-arquivo.pdf]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_acima_de_5_mb'
```

### Valores monetários

```powershell
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_valor[R$ 1.234,56-False-123456]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_valor[89,90-False-8990]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_valor[-25,00-False--2500]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_valor[1.234-False-123400]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_valor[55.90-True-5590]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_valor[-58.70-True--5870]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_valor[-False-None]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_valor[abc-False-None]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_converter_valor[12.34,56-False-None]'
```

### Categorização e análise financeira

```powershell
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_estabelecimento_e_categoria'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_um_unico_mes_nao_confirma_recorrencia'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_tipo_transacao[Pagamento recebido-False-fatura-payment]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_tipo_transacao[Pagamento da fatura-True-extrato-payment]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_tipo_transacao[Pagamento de boleto - Condom\xednio-True-extrato-purchase]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_tipo_transacao[Netflix.Com-True-fatura-purchase]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_tipo_transacao[IOF compra internacional-True-fatura-fee]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_tipo_transacao[Estorno Loja X-False-fatura-refund]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_tipo_transacao[Sal\xe1rio-False-extrato-other]'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_duplicadas_ficam_sinalizadas_e_nao_somem'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_linhas_para_gravar_seguem_a_tabela_transactions'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_analise_de_um_mes_compara_com_o_anterior'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_analise_do_banco_e_igual_a_analise_do_arquivo'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_sem_transacoes_a_analise_vem_vazia'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_estatistica_descritiva_com_valores_conferidos_a_mao'
& $testPython -m pytest -v 'backend/tests/test_previa_fatura.py::test_previa_explica_quando_todas_as_linhas_sao_rejeitadas'
```

### Hash de senha e tokens de sessão

```powershell
& $testPython -m pytest -v 'backend/tests/test_security.py::test_hash_is_salted_and_never_the_password'
& $testPython -m pytest -v 'backend/tests/test_security.py::test_verify_accepts_right_password_and_rejects_wrong_one'
& $testPython -m pytest -v 'backend/tests/test_security.py::test_verify_treats_equivalent_unicode_as_equal'
& $testPython -m pytest -v 'backend/tests/test_security.py::test_verify_rejects_malformed_hashes_without_raising[]'
& $testPython -m pytest -v 'backend/tests/test_security.py::test_verify_rejects_malformed_hashes_without_raising[texto-qualquer]'
& $testPython -m pytest -v 'backend/tests/test_security.py::test_verify_rejects_malformed_hashes_without_raising[scrypt$1$2$3]'
& $testPython -m pytest -v 'backend/tests/test_security.py::test_verify_rejects_malformed_hashes_without_raising[bcrypt$a$b$c$d$e]'
& $testPython -m pytest -v 'backend/tests/test_security.py::test_verify_rejects_malformed_hashes_without_raising[scrypt$x$8$1$!!$!!]'
& $testPython -m pytest -v 'backend/tests/test_security.py::test_session_token_digest_is_sha256_hex'
```

## Rodar os testes de integração da API e do servidor

Os casos automatizados usam serviços temporários quando necessário. Os três
casos de saúde iniciam seu próprio Uvicorn. Os casos de login e o de saúde
com PostgreSQL precisam dos executáveis do PostgreSQL instalados.

```powershell
& $testPython -m pytest -v 'backend/tests/test_api.py::test_api_rejeita_email_sem_arroba_e_senha_curta_no_cadastro'
& $testPython -m pytest -v 'backend/tests/test_api.py::test_previa_retorna_a_analise_de_uma_fatura'
& $testPython -m pytest -v 'backend/tests/test_api.py::test_previa_recusa_arquivo_invalido'
& $testPython -m pytest -v 'backend/tests/test_api.py::test_previa_limita_tamanho_do_arquivo'
& $testPython -m pytest -v 'backend/tests/test_api.py::test_previa_fica_indisponivel_em_producao'
& $testPython -m pytest -v 'backend/tests/test_api.py::test_rotas_financeiras_recusam_requisicoes_sem_sessao[painel]'
& $testPython -m pytest -v 'backend/tests/test_auth.py::test_login_with_right_credentials_opens_a_session'
& $testPython -m pytest -v 'backend/tests/test_auth.py::test_login_gives_the_same_answer_for_wrong_password_and_unknown_email'
& $testPython -m pytest -v 'backend/tests/test_server.py::test_saude_do_servidor_retorna_ok'
& $testPython -m pytest -v 'backend/tests/test_server.py::test_servidor_inicia_e_atende_api_com_postgresql'
& $testPython -m pytest -v 'backend/tests/test_server.py::test_servidor_informa_indisponibilidade_do_postgresql'
```

Para rodar a integração por camada, consulte o [guia de testes](../../docs/testes.md#executar-por-camada).
