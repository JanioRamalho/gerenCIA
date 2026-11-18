# Preparação da atualização do banco hospedado

Autorização: preparar inventário, backup e ensaio em cópia. **Não aplicar
migrações em produção e não promover o deployment nesta etapa.**

## Situação e origem

O frontend está na branch `Janio` (código `bf2efca`). O deployment preparado
`dpl_6WEHasHq1aCxrRvMVLzXffboijbG` encontrou erro de upload por ausência de
`uploads.source_format`. O domínio público continua no deployment anterior.

Os nomes das variáveis da Vercel indicam integração Neon, incluindo
`DATABASE_NEON_PROJECT_ID` e conexões diretas. Seus valores são secretos e
não podem ser exportados pela CLI. A tentativa anterior com `vercel env run`
usou configuração local; essa leitura foi descartada como evidência de produção.
**Revisão, esquema e dados do banco hospedado ainda não foram confirmados.**

O usuário informou que vai configurar a conexão local. No projeto Neon
vinculado à Vercel, conferir a branch e o banco usados por **Production**;
em **Connect**, desativar **Connection pooling** e copiar a conexão direta.
Salvar localmente em `.env.production-db`:

```dotenv
GERENCIA_PRODUCTION_DATABASE_URL=CONEXAO_DIRETA_DO_BANCO_CONFIRMADO
```

Não enviar credenciais pelo chat. O arquivo já é ignorado pelo Git e pelo
deploy. Não substituir o `.env` utilizado pelo desenvolvimento.

## Captura preparada

O script [backup_banco.py](../scripts/backup_banco.py) exige arquivo explícito
e confirmação do host; não consulta `DATABASE_URL` nem faz fallback para `.env`.
Recusa host divergente, conexão Neon com pool e conexão remota sem SSL.

Depois de confirmar a origem, executar na raiz, substituindo somente o host:

```powershell
.\.venv\Scripts\python.exe scripts/backup_banco.py --connection-file .env.production-db --expected-host HOST_DIRETO_CONFIRMADO
```

A captura usa transação `REPEATABLE READ READ ONLY`, exporta o snapshot e
passa o mesmo snapshot ao `pg_dump`. Gera arquivo custom completo do banco,
manifesto com revisão encontrada, assinatura da baseline, estrutura das tabelas
públicas, funções, triggers, definições e estados observados das sequências,
contagens e hashes dos dados, tamanho e SHA-256 do arquivo. Não executa `stamp`, DDL,
migração nem atualização de registros na origem. Credenciais não aparecem na
linha de comando ou nos relatórios. Erros não imprimem SQL ou detalhes sensíveis.

Os resultados ficam em `.private/database/`, ignorado pelo Git e Vercel.
Arquivos parciais ou somente `pg_restore --list` não comprovam restauração.
O dump contém dados pessoais e hashes de autenticação: manter a pasta privada.
Usar cliente PostgreSQL compatível com a versão real; o padrão local é 18.

O dump cobre um banco, não contas/roles globais nem arquivos externos.
Registrar separadamente configurações do provedor, permissões e disponibilidade
de arquivos históricos antes de definir a recuperação de produção.

## Ensaio exigido com o backup real

1. Verificar SHA-256 e restaurar o arquivo exato em banco vazio de um cluster
   local descartável, com `--exit-on-error --single-transaction --no-owner
   --no-privileges`. Não usar uma URL de destino fornecida por `.env`.
2. Gerar manifesto completo **desse primeiro restore**, incluindo sequências,
   funções, triggers, restrições, índices, contagens e hashes dos dados. Comparar
   tabelas públicas com o snapshot da captura. Sequências podem avançar durante
   um dump com gravações concorrentes; conferir integridade e ausência de colisões.
3. Determinar a revisão real. Se não há Alembic, validar a assinatura congelada
   antes de adotar `0001_current_schema`, exclusivamente na cópia. Diferenças
   exigem plano específico; não usar `stamp head` nem reaplicar `init.sql`.
4. Ensaiar as migrações na cópia. A 0002 adiciona metadados financeiros; a 0003
   cria `category_budgets` e `notifications`; a 0004 preserva metadados e remove
   estruturas antigas. Aplicar só a 0002 não resolve necessariamente o upload:
   o campo antigo `storage_path` pode continuar obrigatório.
5. Interromper se houver bruto/mapeamento não vazio, divergência de linha/folha
   ou colisão de `legacy_before_0004`. Não apagar conteúdo para contornar guardas.
6. Comparar registros completos das tabelas preservadas. Comprovar cada campo
   removido de uploads e cada identidade/vínculo Bronze/mapeamento no snapshot
   de qualidade. Preservar registros de qualidade anteriores; relatórios novos
   sem qualidade histórica devem estar marcados `migration_metadata_only`.
7. Confirmar `0004_remove_legacy`, `alembic check`, integridade e sequências.
   Testar upload CSV/XLSX, listagem, transações, limites e isolamento de usuários
   na cópia, sem usar contas reais para testes de escrita.
8. Restaurar o **mesmo dump original** em segundo banco local vazio e comparar
   dados, estruturas legadas e sequências com o primeiro restore. Validar também
   o código anterior compatível. `downgrade` e reversão de deploy isolada não
   recuperam o esquema removido pela 0004.

## Evidência local e limites

O teste [test_backup_banco.py](../scripts/tests/test_backup_banco.py) usa somente
cluster PostgreSQL descartável. Exercita recusa de configuração implícita,
captura de baseline com dados fictícios, restauração com hashes iguais,
adoção e migração na cópia, comparação de transações, verificação dos modelos,
segunda restauração e preservação da origem. Os testes existentes das migrações
cobrem preservação de origem e recusa atômica de dados não convertidos.
Os hashes fixam UTC, formato de datas e ordenação `COLLATE "C"`; o teste
usa fusos diferentes na origem e no restore para evitar falsos desencontros.

Resultado local: **2 testes da ferramenta passaram**, incluindo a comparação
de todas as sequências e estruturas públicas entre captura e restores;
**9 testes existentes de migração passaram**. O primeiro comando encontrou
diretório de teste ausente; depois foi corrigida a passagem dos parâmetros
ao `pg_dump`. A execução final da ferramenta passou em 14,25 segundos.

| Etapa no banco real | Estado |
| --- | --- |
| Conexão direta confirmada | Aguardando configuração do usuário |
| Inventário e backup real | Pendente |
| Restauração e ensaio do backup real | Pendente |
| Recuperação com código anterior | Pendente |
| Migração em produção | Não autorizada e não executada |
| Promoção do deployment novo | Não executada |

Isso valida o mecanismo com dados sintéticos; **não substitui o ensaio do backup
real**, a revisão das estruturas reais ou a validação funcional da cópia real.

O relatório final deve separar: captura real concluída, restauração comprovada,
ensaio aprovado ou recusado e recuperação anterior comprovada. Só depois desses
resultados será apresentada uma proposta concreta para autorização de produção,
com janela sem gravações, backup final atualizado, código de recuperação e
validação do deployment antes de promover o domínio público.

Referências: [pg_dump PostgreSQL 18](https://www.postgresql.org/docs/18/app-pgdump.html),
[pg_restore PostgreSQL 18](https://www.postgresql.org/docs/18/app-pgrestore.html),
[backup direto Neon](https://neon.com/docs/manage/backup-pg-dump).
