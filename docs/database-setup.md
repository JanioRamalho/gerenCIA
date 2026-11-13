# Banco PostgreSQL do gerenCIA

O esquema é versionado pelo Alembic, a partir do `alembic.ini` na raiz.
`0001_baseline` preserva o esquema histórico e as categorias iniciais;
`0002_upload_history` prepara os metadados da importação. As tabelas antigas
foram preservadas, sem apagar dados nesta etapa.

Em 12/11/2026, o banco `neondb` da branch `main` no Neon foi adotado e
atualizado para `0002_upload_history`, preservando as contagens das 10 tabelas
existentes. A comparação com os modelos não encontrou alterações pendentes.
Uma nova conexão confirmou a revisão; as rotas de saúde do banco e categorias
da API local responderam 200. O `.env` local passou a apontar para esse Neon.
Isso não publica o código novo do site na Vercel.

## Conexão para migrações

`DATABASE_URL` é a conexão da aplicação. Para criar e alterar tabelas, o
Alembic precisa de uma conexão com o proprietário das tabelas e permissão
de criação no esquema `public`. Se a conexão da API não tem essas permissões,
acrescente no `.env`, mantendo `DATABASE_URL` como está:

```dotenv
MIGRATION_DATABASE_URL=postgresql+psycopg://OWNER:SENHA@localhost:5432/gerencia_db
```

Troque `OWNER`, `SENHA`, servidor, porta e banco pelos valores corretos. Em
um PostgreSQL local instalado com o usuário padrão, o proprietário costuma
ser `postgres`: use a senha desse usuário no servidor, não a senha de
desbloqueio do pgAdmin. Caracteres reservados da senha precisam de codificação
de URL. Nunca compartilhe a conexão nem coloque credenciais no Git.

As duas conexões devem apontar para o mesmo banco. Na hospedagem, prefira a
conexão direta do proprietário para executar migrações. A API continua usando
suas permissões normais. Sem `MIGRATION_DATABASE_URL`, o Alembic usa
`DATABASE_URL`. Migrações são executadas manualmente, não ao iniciar a API.

## Adotar o banco existente

Não execute `init.sql` nem use `stamp` sozinho para pular a conferência.
A partir da raiz do projeto:

```powershell
# Apenas conferir a estrutura, sem alterações.
.\.venv\Scripts\python.exe scripts/adopt_alembic.py

# Conferir, registrar a base histórica e aplicar as atualizações.
.\.venv\Scripts\python.exe scripts/adopt_alembic.py --apply

# Verificar a revisão aplicada e a revisão mais recente disponível.
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic heads
```

Depois da adoção, `current` e `heads` devem mostrar `0002_upload_history`.
O script preserva registros e UUIDs, valida a estrutura antes da adoção e
executa o registro e a atualização na mesma transação. Se o banco já estiver
versionado, aplica somente as revisões pendentes. Falhas de permissão exigem
corrigir a conexão de migração; não ampliar as permissões da API.

## Banco novo com Alembic

Crie um banco vazio no PostgreSQL 18, configure as conexões e execute:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
```

O Alembic cria as 10 tabelas da aplicação, as proteções, as 11 categorias
globais e sua tabela de controle `alembic_version`. Não execute `init.sql`
antes ou depois desse comando no mesmo banco.

O comando antigo `python scripts/instalar_banco.py` também delega ao Alembic.
Ele não instala mais um esquema paralelo sem registrar a versão.

## Próximas alterações de esquema

```powershell
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "descricao_da_alteracao"
# Revise o arquivo gerado antes de aplicar.
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic check
```

O autogenerate compara os modelos com o banco, mas as regras de triggers e
as migrações de dados precisam de revisão manual. Não edite revisões já
aplicadas: crie uma nova. A reversão da base é bloqueada para evitar apagar
o esquema; a revisão de upload também bloqueia reversão com dados novos.

## Referência: instalação SQL anterior ao Alembic

Os comandos históricos abaixo ficam documentados para bancos antigos. O
fluxo atual de instalação e atualização é o Alembic, explicado acima.

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

Os arquivos em `scripts/migrations/` são atualizações SQL históricas. Bancos
antigos precisam dessas proteções antes de serem adotados pelo Alembic.

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
inicial. Use o Alembic para criar e atualizar o esquema completo.

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
