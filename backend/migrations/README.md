# Migrações do gerenCIA

Execute na raiz do projeto, usando `alembic.ini`:

```powershell
.\.venv\Scripts\python.exe -m alembic history
.\.venv\Scripts\python.exe -m alembic upgrade head
```

O segundo comando instala um banco vazio ou atualiza um banco já versionado.
Para um banco legado com tabelas, use antes a adoção validada descrita em
[docs/database-setup.md](../../docs/database-setup.md).

A revisão `0001_current_schema` congela o esquema de `scripts/init.sql` com as
atualizações SQL 001/002, os triggers e a carga de categorias. O SQL ao lado da
revisão e `0001_schema_signature.json` não devem ser alterados após a adoção.
A assinatura registra hashes SHA-256 das definições de colunas, restrições,
índices, triggers e funções obtidas no PostgreSQL 18 pelo instalador legado;
não contém dados de usuários. Diferenças precisam ser investigadas, e não
resolvidas substituindo a assinatura. Novas mudanças entram em novas revisões.

O `env.py` também aceita uma conexão em `Config.attributes['connection']`,
permitindo testar e adotar dentro de uma transação explícita sem acessar o
banco configurado no `.env`. A API não aplica migrações automaticamente.
