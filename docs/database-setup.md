# Banco PostgreSQL do gerenCIA

O esquema está em `scripts/init.sql`. Ele cria as 10 tabelas, índices,
relacionamentos, proteções de categorias e as 11 categorias globais do
planejamento. Todas as tabelas também recebem um código numérico curto.
O banco `gerencia_db` precisa existir antes da execução.
Os comandos abaixo são instruções de instalação; os testes não os executam
contra o servidor instalado no computador.

## Instalação nova

Use PostgreSQL 18 e execute a partir da raiz do repositório no PowerShell.
O exemplo usa o administrador `postgres` para instalar o esquema; as
credenciais da aplicação devem ser configuradas separadamente.

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
& "$pgBin\createdb.exe" -h 127.0.0.1 -p 5432 -U postgres gerencia_db
& "$pgBin\psql.exe" -X -h 127.0.0.1 -p 5432 -U postgres -d gerencia_db -v ON_ERROR_STOP=1 -f scripts/init.sql
```

Execute `init.sql` uma vez, em um banco vazio. O script usa uma transação e
interrompe ao primeiro erro, evitando uma instalação parcial. Os arquivos
incluídos por `\ir` são resolvidos em relação à pasta do próprio script.
Preserve `scripts/sql/` ao distribuir o instalador.

Confira o resultado:

```powershell
& "$pgBin\psql.exe" -X -h 127.0.0.1 -p 5432 -U postgres -d gerencia_db -c '\dt public.*'
& "$pgBin\psql.exe" -X -h 127.0.0.1 -p 5432 -U postgres -d gerencia_db -c 'SELECT name FROM categories WHERE user_id IS NULL ORDER BY name;'
```

O primeiro comando deve mostrar 10 tabelas; o segundo, 11 categorias.
No pgAdmin, abra o servidor, `Databases`, `gerencia_db`, `Schemas`, `public`,
`Tables`. Atualize a árvore se o banco tiver sido criado pelo terminal.

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

Os arquivos em `scripts/migrations/` são atualizações SQL manuais. A adoção
de Alembic permanece uma etapa prevista na arquitetura.

Se a correção de integridade já estiver instalada, execute apenas `002_display_codes.sql`.
A instalação nova por `init.sql` já inclui ambas as alterações; não execute
as atualizações novamente nesse caso.

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

Os modelos SQLAlchemy mapeiam o esquema instalado por esses scripts.
`Base.metadata.create_all()` sozinho não instala os triggers nem a carga
inicial. Use o instalador SQL para criar o esquema completo.

## Testes isolados

Os testes usam os executáveis `initdb`, `pg_ctl` e `psql` do PostgreSQL para
criar um servidor temporário em uma porta livre. Não usam `DATABASE_URL` nem
o serviço PostgreSQL instalado. O servidor temporário é encerrado ao terminar.
No Windows, os processos são iniciados sem janela visível.

```powershell
.\.venv\Scripts\python.exe -m pytest -o pythonpath=backend backend/tests/test_database_integrity.py -q
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
modelos SQLAlchemy.
