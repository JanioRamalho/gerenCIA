# Banco PostgreSQL do gerenCIA

O esquema atual é instalado pelo Alembic, configurado em `alembic.ini` e
`backend/migrations/`. A API não executa migrações ao iniciar. A revisão atual
é **`0004_remove_legacy`**, com dez tabelas da aplicação:

`users`, `sessions`, `uploads`, `categories`, `transactions`,
`category_rules`, `quality_checks`, `rejected_rows`, `category_budgets` e
`notifications`. `alembic_version` registra a revisão aplicada. A etapa atual
não inclui tabelas, chamadas ou credenciais de IA.

| Revisão | Resultado |
| --- | --- |
| `0001_current_schema` | Cópia imutável do esquema anterior, com proteções, códigos e onze categorias globais |
| `0002_financial_core` | Natureza `income`, metadados de upload, identificador bancário, saldo, folha e suspeita de duplicidade |
| `0003_budgets_notifications` | Limites mensais por categoria e memória persistente das faixas notificadas |
| `0004_remove_legacy` | Preservação de metadados e retirada de Bronze, mapeamentos e campos de processamento sem consumidores |

O banco precisa existir antes da instalação. Os comandos operacionais usam
`DATABASE_URL` do ambiente ou do `.env` da raiz; variáveis do ambiente têm
prioridade. Nenhuma credencial fica em `alembic.ini`. Os testes recebem
conexões explícitas para PostgreSQL descartável e não usam esse banco de uso.

## Instalação nova

Na raiz do projeto, com as dependências de desenvolvimento instaladas:

```powershell
.\.venv\Scripts\python.exe -m alembic history
```

O histórico deve terminar em `0004_remove_legacy (head)`. Use PostgreSQL 18
e um banco vazio. Para criar um banco local, adapte host, porta e usuário:

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
& "$pgBin\createdb.exe" -h 127.0.0.1 -p 5432 -U postgres gerencia_db
```

Depois de conferir que `DATABASE_URL` aponta para o destino desejado:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic check
```

`current` deve mostrar `0004_remove_legacy (head)`; `check` compara os
modelos com o esquema e deve terminar sem novas operações. A comparação ignora
tabelas externas ao modelo do gerenCIA, por isso a presença de Bronze não pode
ser descartada apenas com `check`: a revisão 0004 precisa ter sido aplicada.
Repetir `upgrade head` não recria tabelas nem duplica categorias.

A instalação completa apresenta onze tabelas ao contar `alembic_version`,
e onze categorias globais. `Base.metadata.create_all()` sozinho não instala
triggers nem a carga inicial; use Alembic para um banco completo.

## Adotar e atualizar um banco existente

Antes de evoluir um ambiente em uso, reserve uma janela sem gravações e
preserve uma cópia de segurança cuja restauração tenha sido verificada.
Mantenha a versão da aplicação compatível com o esquema: não inicie o código
que exige a revisão nova antes de concluí-la.

Se o banco já recebeu `scripts/init.sql` atualizado e ainda não é versionado:

```powershell
.\.venv\Scripts\python.exe scripts/adotar_alembic.py
```

Sem argumentos, o script somente confere a estrutura. Ele compara colunas,
defaults, identidades, restrições, índices, triggers e funções com a assinatura
congelada da revisão 0001. Dados pessoais, permissões, donos das tabelas e
posições atuais das sequências não são usados como assinatura do esquema.

Se a conferência aprovar o banco:

```powershell
.\.venv\Scripts\python.exe scripts/adotar_alembic.py --stamp
.\.venv\Scripts\python.exe -m alembic current
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m alembic check
```

`--stamp` repete a validação e grava `0001_current_schema` na mesma transação.
Não renumera registros, recria tabelas ou sobrescreve outra revisão. Não use
`stamp head` para pular a conferência ou as transferências de dados.

Se o banco recebeu os scripts SQL mais antigos, aplique primeiro as correções
históricas necessárias, sem executar novamente `init.sql` sobre os dados:

```powershell
& "$pgBin\psql.exe" -X -h 127.0.0.1 -p 5432 -U postgres -d gerencia_db -v ON_ERROR_STOP=1 -f scripts/migrations/001_integrity.sql
& "$pgBin\psql.exe" -X -h 127.0.0.1 -p 5432 -U postgres -d gerencia_db -v ON_ERROR_STOP=1 -f scripts/migrations/002_display_codes.sql
```

Esses scripts validam as regras e preservam os dados. Se a correção de
integridade já estiver instalada, não a reaplique: execute apenas a atualização
de códigos ainda pendente. Depois, siga a adoção pelo Alembic. Diferenças
estruturais não são corrigidas automaticamente pelo script de adoção.

Os scripts antigos continuam disponíveis para rastreabilidade e testes da
baseline. Novas instalações e novas evoluções usam Alembic. A revisão 0001,
seu SQL e sua assinatura permanecem imutáveis.

## Preservação e guardas da revisão 0004

A revisão bloqueia temporariamente as tabelas envolvidas para conferir e
transferir o mesmo conjunto de registros. Antes de qualquer retirada, ela
interrompe com `CommandError` quando encontra:

- `bronze_rows.raw_data` não vazio, sem representação validada no modelo final;
- `upload_mappings.mapping` não vazio, sem conversão validada;
- linha ou folha da transação divergente da origem Bronze;
- chave de preservação já existente que seria sobrescrita.

A falha mantém a revisão anterior e os registros, em vez de descartar conteúdo.
Resolva a origem e teste a conversão em uma cópia descartável antes de repetir;
não esvazie o bruto ou o mapeamento para contornar a guarda.

Quando a transferência é segura, a revisão preserva em
`quality_checks.details.legacy_before_0004`:

- referências e metadados antigos de processamento do upload;
- UUID, código, linha, folha, hash e data de ingestão de Bronze;
- vínculo da origem com a transação correspondente;
- identidade e datas dos registros de mapeamento vazios.

A folha conhecida preenche `transactions.source_sheet` quando ela estava
ausente. UUIDs, códigos, valores, natureza e linha das transações são mantidos.
O relatório de qualidade existente conserva sua identidade e seus dados;
somente recebe o bloco de preservação.

Se não havia relatório, cria-se um registro identificado por
`migration_metadata_only`, com contagens dos registros efetivamente
persistidos e qualidade original indisponível. Ele não certifica qualidade
histórica nem reconstrói totais, sinais ou identificadores perdidos.

Depois da preservação, saem `bronze_rows`, `upload_mappings`,
`transactions.bronze_row_id` e os campos `uploads.storage_path`, `status`,
`error_message`, `processing_started_at` e `processing_finished_at`.
A aplicação continua gravando diretamente transações, rejeições e qualidade.

A revisão exige conexão ativa para verificar os dados. Para inspecionar o SQL
da baseline sem conectar, pode-se usar:

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade 0001_current_schema --sql
```

`upgrade head --sql` não substitui a conferência da revisão 0004.
`downgrade` dessa retirada é recusado: a recuperação depende da cópia de
segurança e do código correspondente ao esquema restaurado. Um commit de
código, sozinho, não reverte uma alteração de banco.

## Integridade e convenções financeiras

- Cada tabela tem `id` UUID para relacionamentos e `code` numérico
  automático, único apenas dentro da própria tabela. Exclusões e transações
  revertidas podem deixar intervalos; os códigos não são renumerados.
- Uploads e seus dependentes pertencem à sessão do usuário. Chaves compostas
  impedem vincular uma transação a upload de outra pessoa.
- Categorias globais têm `user_id = NULL`; categorias pessoais só podem ser
  usadas por seu dono. Triggers impedem mudar o dono de uma categoria.
- Parcelas têm ambos os campos ausentes ou ambos preenchidos, positivos e com
  a parcela atual menor ou igual ao total.
- Valores monetários usam `Numeric(14,2)`, centavos inteiros ou `Decimal`
  no cálculo. Natureza e valor absoluto são armazenados separadamente.
- Gasto líquido soma compras e tarifas e subtrai estornos; receita e pagamento
  ficam separados. Natureza histórica desconhecida continua explícita.
- A duplicidade confirmada usa usuário, formato, tipo de documento e
  identificador bancário. Igualdade sem identificador é suspeita e permanece
  contabilizada. Excluir a cópia canônica permite promover outra cópia.
- Limites são mensais e positivos. Os avisos têm unicidade por usuário,
  categoria, mês e faixa: atingir 80% e passar de 100%. Exatamente 100% não
  constitui ultrapassagem. Excluir e recriar um limite não apaga essa memória.

O envio de arquivos é limitado a **4 MB** na aplicação. As naturezas, sinais,
comparações e critérios estatísticos são detalhados em
[análise de dados](analise-de-dados.md).

## Verificações e próximas revisões

Os testes iniciam um PostgreSQL temporário em porta livre, sem usar
`DATABASE_URL` ou o serviço instalado. O servidor é encerrado ao terminar.
No Windows, os executáveis ficam por padrão em
`C:\Program Files\PostgreSQL\18\bin`; também podem ser indicados por
`GERENCIA_PG_BIN`.

```powershell
.\.venv\Scripts\python.exe -m pytest -o pythonpath=backend backend/tests/test_database_integrity.py backend/tests/test_display_codes.py backend/tests/test_alembic.py backend/tests/test_financial_migrations.py -q
```

A baseline continua testada separadamente. Os testes do esquema final cobrem
instalação limpa, evolução, comparação com modelos, preservação de origem,
recusa atômica de dados não convertidos, autorização e códigos.

Para uma próxima mudança, gere um rascunho em banco de desenvolvimento:

```powershell
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "descricao_da_mudanca"
```

Revise os dados e o DDL manualmente. Triggers, funções, CHECKs e transferências
de dados precisam de atenção explícita. Teste instalação e evolução em
PostgreSQL descartável antes de aplicar no destino de uso. Não edite a revisão
inicial para acomodar diferenças novas.
