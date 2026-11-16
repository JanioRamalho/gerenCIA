# Banco PostgreSQL do gerenCIA

O esquema passa a ser versionado pelo Alembic, configurado em `alembic.ini` e
`backend/migrations/`. A revisão `0001_current_schema` reproduz o esquema
atual: 10 tabelas da aplicação, índices, relacionamentos, proteções de categorias,
códigos numéricos e as 11 categorias globais iniciais. O Alembic acrescenta a
tabela `alembic_version`, que registra a revisão aplicada.

O banco precisa existir antes da execução. Os comandos usam o `DATABASE_URL`
do ambiente ou do `.env` da raiz, com a mesma normalização de URL da API.
Variáveis do ambiente têm prioridade; nenhuma credencial fica no `alembic.ini`.
Os testes usam exclusivamente PostgreSQL descartável, separado desse endereço.

## Preparar as ferramentas

No PowerShell, na raiz do projeto:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m alembic history
```

O histórico deve mostrar `<base> -> 0001_current_schema (head)`.
Alembic e suas dependências estão nas dependências de desenvolvimento da raiz;
a API não executa migrações ao iniciar. Execute-as separadamente da hospedagem.

## Instalação nova

Use PostgreSQL 18 e um banco vazio. Se precisar criá-lo localmente:

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
& "$pgBin\createdb.exe" -h 127.0.0.1 -p 5432 -U postgres gerencia_db
```

Configure `DATABASE_URL` e instale o esquema:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
```

`current` deve mostrar `0001_current_schema (head)`. `check` compara os modelos
com o banco e não deve encontrar novas operações. Uma segunda execução de
`upgrade head` não recria tabelas nem duplica categorias. A revisão inicial usa
uma cópia SQL fixa, sem comandos exclusivos do psql e sem exigir o proprietário
`postgres`; as tabelas pertencem à conta que executa a instalação.

Para inspecionar o SQL sem conectar ao banco:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head --sql
```

Esse comando ainda precisa de uma URL PostgreSQL configurada, mas não abre a
conexão. No pgAdmin, a instalação nova apresenta 11 tabelas ao contar também
`alembic_version`, e 11 categorias globais.

## Adotar um banco já instalado

Se o banco já recebeu `scripts/init.sql` atualizado, não execute a criação
inicial sobre ele. Faça um backup e confira a compatibilidade:

```powershell
.\.venv\Scripts\python.exe scripts/adotar_alembic.py
```

Sem argumentos, o script só lê a estrutura e não grava a versão. Ele compara
colunas, defaults, identidades, restrições, índices, triggers (inclusive se estão
ativados) e funções de proteção com a assinatura fixa da revisão inicial em
PostgreSQL 18. Dados, donos das tabelas, permissões e valores atuais das
sequências não entram nessa comparação. Categorias personalizadas e outras
tabelas do banco são preservadas.

Se estiver compatível, registre a revisão inicial:

```powershell
.\.venv\Scripts\python.exe scripts/adotar_alembic.py --stamp
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic upgrade head
```

`--stamp` repete a validação e só então grava `0001_current_schema` em
`alembic_version`, na mesma transação. Não recria tabelas, não altera registros
nem reinicia códigos. Ele registra explicitamente a base, mesmo quando existirem
migrações futuras. Não use `alembic stamp head` para pular a conferência.
Se outra revisão já estiver registrada, o script recusa sobrescrevê-la.

## Banco com a versão antiga

Não execute novamente `init.sql`. Para um banco que recebeu o script original,
use a atualização versionada:

```powershell
& "$pgBin\psql.exe" -X -h 127.0.0.1 -p 5432 -U postgres -d gerencia_db -v ON_ERROR_STOP=1 -f scripts/migrations/001_integrity.sql
& "$pgBin\psql.exe" -X -h 127.0.0.1 -p 5432 -U postgres -d gerencia_db -v ON_ERROR_STOP=1 -f scripts/migrations/002_display_codes.sql
```

A atualização mantém os dados e valida as regras antes de confirmar a
transação. Ela bloqueia gravações nas quatro tabelas envolvidas durante a
execução. Se houver parcelas incompletas, duplicatas de linha na mesma aba ou
vínculos com categorias de outro usuário, a atualização falha e é revertida.
Revise esses registros e execute novamente; nenhum registro é removido ou
alterado silenciosamente.

Os arquivos em `scripts/migrations/` continuam sendo o histórico SQL anterior
ao Alembic. Depois de atualizar o banco antigo, siga a seção de adoção acima.
Se a conferência apontar outra diferença, revise o esquema indicado antes de
registrar a base; o script não tenta corrigir diferenças automaticamente.

Se a correção de integridade já estiver instalada, execute apenas `002_display_codes.sql`.
A instalação nova pelo Alembic ou por `init.sql` já inclui ambas as alterações;
não execute as atualizações SQL novamente nesse caso. `scripts/init.sql`, seus
arquivos em `scripts/sql/` e `scripts/instalar_banco.py` são mantidos para
compatibilidade e testes do legado. Novas instalações devem usar Alembic.

## Próximas mudanças do esquema

Depois de alterar os modelos SQLAlchemy, gere uma revisão em um banco de
desenvolvimento já atualizado:

```powershell
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "descricao_da_mudanca"
```

Revise `upgrade()` e `downgrade()` no arquivo criado em
`backend/migrations/versions/`, escreva os testes e só então aplique:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic check
```

A geração automática é um rascunho: alterações em triggers, funções, regras
CHECK e dados iniciais precisam ser escritas e revisadas explicitamente.
Tabelas que não estejam nos modelos são ignoradas na comparação para não
propor a exclusão de objetos de outros sistemas; ao remover uma tabela do
gerenCIA, escreva a remoção na revisão. Veja a
[documentação de autogenerate](https://alembic.sqlalchemy.org/en/latest/autogenerate.html).

A revisão inicial e seus arquivos SQL/assinatura ficam imutáveis. Mudanças
posteriores entram em novas revisões; não altere a base nem regenere sua
assinatura para fazer uma incompatibilidade desaparecer.

`downgrade base` é recusado pela revisão inicial, pois apagaria também dados
anteriores à adoção. Restauração dessa base exige backup. Revisões posteriores
devem documentar e testar suas próprias reversões.

## Códigos numéricos e UUIDs

Cada uma das 10 tabelas tem dois identificadores:

- `id`: UUID interno, que continua sendo a chave primária e a referência
  utilizada pelos relacionamentos entre tabelas.
- `code`: código numérico curto, gerado automaticamente pelo PostgreSQL e
  único dentro da própria tabela. Usuário 1 e categoria 1 são registros
  diferentes; não há uma numeração única para o banco inteiro.

A numeração de cada tabela começa em 1. Registros existentes recebem códigos
na atualização; registros novos recebem o próximo código automaticamente.
O código não é uma contagem: exclusões, tentativas de inserção rejeitadas e
transações revertidas podem deixar intervalos. Os registros não são
renumerados. Não informe `code` em um INSERT normal.

Para visualizar as categorias com o código primeiro no pgAdmin:

```sql
SELECT code AS codigo, name AS categoria, id AS id_interno
FROM public.categories
ORDER BY code;
```

O endpoint de categorias inclui `code` na resposta junto com `id`. Novos
modelos SQLAlchemy devem herdar `DisplayCodeMixin` para seguir o mesmo padrão.

A atualização 002 é transacional e preserva UUIDs, relacionamentos e dados.
Ela interrompe se alguma das tabelas já tiver uma coluna `code` ou se não
conseguir obter os bloqueios em cinco segundos. Nesse último caso, encerre
transações abertas no pgAdmin antes de executar novamente.

## Regras de integridade

- Excluir uma linha Bronze remove somente `transactions.bronze_row_id`.
  A transação conserva seu usuário e upload. Excluir o próprio upload
  continua removendo seus registros relacionados.
- Parcelas ficam com ambos os campos vazios ou ambos preenchidos, positivos,
  com parcela atual menor ou igual ao total.
- A linha Bronze é identificada por upload, aba e número da linha. Para CSV,
  `sheet_name` deve ser `NULL`; duplicatas de CSV continuam bloqueadas.
- Categorias globais têm `user_id = NULL`. Categorias pessoais só podem ser
  usadas em transações e regras do mesmo usuário.
- O dono de uma categoria é definido na criação e não pode ser transferido.
  Nome, cor e estado ativo continuam editáveis. Para outro dono, crie outra
  categoria. Isso também impede invalidar vínculos por uma alteração posterior.
- A carga das categorias iniciais pode ser repetida sem duplicá-las. Não
  substitui nomes, cores ou estados de categorias que já existem.

Os modelos SQLAlchemy mapeiam o esquema. `Base.metadata.create_all()` sozinho
não instala os triggers nem a carga inicial. Use `alembic upgrade head` para
criar o esquema completo.

## Testes isolados

Os testes usam os executáveis `initdb`, `pg_ctl` e `psql` do PostgreSQL para
criar um servidor temporário em uma porta livre. Não usam `DATABASE_URL` nem
o serviço PostgreSQL instalado. O servidor temporário é encerrado ao terminar.
No Windows, os processos são iniciados sem janela visível.

```powershell
.\.venv\Scripts\python.exe -m pytest -o pythonpath=backend backend/tests/test_database_integrity.py -q
.\.venv\Scripts\python.exe -m pytest -o pythonpath=backend backend/tests/test_alembic.py -q
```

No Windows, a localização padrão dos executáveis é
`C:\Program Files\PostgreSQL\18\bin`. Em outros ambientes, eles são
procurados no `PATH`. Para indicar outra instalação:

```powershell
$env:GERENCIA_PG_BIN = 'C:\caminho\PostgreSQL\18\bin'
```

Os testes verificam instalação nova, atualização de esquema existente,
parcelas, exclusões, categorias entre usuários, abas de XLSX, duplicatas de
CSV, categorias iniciais, geração e unicidade dos códigos numéricos,
preservação dos registros na atualização e as restrições geradas pelos
modelos SQLAlchemy. A suíte de integridade e de códigos também roda sobre uma
instalação feita por Alembic, e a autenticação usa esse caminho para preparar
seu banco. Os testes de migrações verificam instalação nova, adoção com dados,
preservação de UUIDs/códigos/sequências, recusa de diferenças estruturais,
SQL offline e comparação com os modelos.
