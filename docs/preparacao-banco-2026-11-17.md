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
Essa limitação foi resolvida com a conexão direta fornecida pelo usuário em
17/11. A captura real confirmou a revisão **`0002_upload_history`**, ausente
do histórico de migrações atual. O banco não é simplesmente uma instalação
da baseline aguardando as revisões 0002 a 0004.

O arquivo local `.env.production-db` foi configurado e está ignorado pelo Git
e pela Vercel. Para futuras capturas, no projeto Neon
vinculado à Vercel, conferir a branch e o banco usados por **Production**;
em **Connect**, desativar **Connection pooling** e copiar a conexão direta.
Salvar localmente em `.env.production-db`:

```dotenv
GERENCIA_PRODUCTION_DATABASE_URL=CONEXAO_DIRETA_DO_BANCO_CONFIRMADO
```

Não registrar credenciais em commits ou relatórios. Não substituir o `.env`
utilizado pelo desenvolvimento.

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
| Conexão direta e revisão | Confirmadas: `0002_upload_history` |
| Inventário e backup real | Concluídos, com snapshot compartilhado e SHA-256 |
| Primeira restauração local | Dados, estruturas e sequências iguais à captura |
| Ensaio da migração atual | Recusado: revisão antiga ausente do grafo atual |
| Segunda restauração do mesmo backup | Igual à primeira, incluindo estruturas legadas e sequências |
| Teste funcional com código anterior | Não realizado; artefato histórico precisa ser identificado |
| Migração em produção | Não autorizada e não executada |
| Promoção do deployment novo | Não executada |

Os testes sintéticos validam o mecanismo. A evidência real abaixo confirma a
restauração, mas **reprova a aplicação das migrações atuais sem uma ponte**.

## Resultado do ensaio real em 17/11/2026

Captura realizada às 23h36 (São Paulo), em PostgreSQL da família 18:

- Backup privado: `.private/database/20261118T023615573346Z/database.dump`.
- Manifesto da captura: `manifest.json`, na mesma pasta.
- Tamanho: 58.757 bytes.
- SHA-256: `927f30b2cbc322166de7a1ed594f4818255da6469d823b99fa2a34e27093acff`.
- Dados: 3 usuários, 2 uploads, 94 transações e 2 relatórios de qualidade;
  onze categorias, sem linhas Bronze ou mapeamentos.
- Relatório do ensaio: `.private/real-rehearsal-njrrrgjp/report.json`.

O arquivo exato foi restaurado em **dois bancos locais novos**, dentro de um
cluster temporário. Em ambos, os hashes de todas as tabelas públicas, estruturas
catalogadas e estados de todas as sequências coincidiram com a captura. A segunda
restauração coincidiu também integralmente com a primeira. O cluster temporário
foi encerrado. Isso comprova a recuperação dos dados e estruturas deste backup;
não comprova configuração de roles do Neon, arquivos externos ou funcionamento
do código antigo, que não foram ensaiados.

Na primeira cópia, a validação da baseline foi recusada por diferenças em
`uploads` e `transactions`. O `upgrade head` atual também foi recusado com
`CommandError`: `0002_upload_history` não pertence ao grafo atual. Após a falha,
dados, estruturas e sequências da cópia continuaram iguais ao primeiro restore.
Nenhum `stamp`, migração ou escrita de dados foi executado no Neon.

### Divergências que impedem aplicar a migração existente

| Banco real | Histórico/modelo atual |
| --- | --- |
| `0002_upload_history` | `0001_current_schema` → `0002_financial_core` → `0003` → `0004` |
| `recognized_format` | `source_format` |
| `document_type` aceita `bank_statement` / `credit_card_invoice` | Aceita `extrato` / `fatura` |
| Períodos, identificador bancário, índice e `income` já existem | A 0002 tenta criar parte desses objetos novamente |
| `storage_path` já aceita nulo | Baseline atual o declara obrigatório antes da retirada na 0004 |
| Restrição de upload de 5 MiB, `NOT VALID` | Esquema atual declara 25 MiB; API continua limitada a 4 MB |
| Sem campos de saldo, folha, suspeita, limites e notificações | Exigidos pelo código atual |

Nos dois uploads desta captura, `document_type` e `recognized_format` estão
nulos. Isso não autoriza inferir o tipo/formato histórico. Não houve conteúdo
Bronze/mapeamento não vazio, vínculo de transação com Bronze ou colisão de
`legacy_before_0004`. Não há uploads acima de 5 MiB nesta captura.

### Caminho necessário antes de propor aplicação em produção

Preparar uma ponte explícita de compatibilidade, sem alterar as revisões
históricas existentes. Primeiro procurar o artefato que instalou
`0002_upload_history`; essa revisão não foi localizada no histórico Git
alcançável consultado. A ponte deve exigir revisão e assinatura conhecidas,
preservar todos os valores originais, tratar tipos e formatos conhecidos sem
inferir nulos, adicionar somente objetos ausentes e alinhar as restrições sem
excluir uploads. Não usar `stamp 0001`, `stamp 0002_financial_core` ou
`stamp head` para saltar essas diferenças.

Depois de preparar a ponte, repetir o ensaio na cópia, comparar integralmente
os registros preservados e os snapshots de metadados, verificar equivalência
com o esquema final e testar os fluxos da API. A transição de histórico só pode
ser registrada após a equivalência comprovada, na mesma transação e com trilha
auditável. **Essa ponte ainda não foi implementada; o resultado atual não libera
produção.** A inspeção, o backup e o ensaio não modificaram o código do backend.

O relatório final deve separar: captura real concluída, restauração comprovada,
ensaio aprovado ou recusado e recuperação anterior comprovada. Só depois desses
resultados será apresentada uma proposta concreta para autorização de produção,
com janela sem gravações, backup final atualizado, código de recuperação e
validação do deployment antes de promover o domínio público.

Referências: [pg_dump PostgreSQL 18](https://www.postgresql.org/docs/18/app-pgdump.html),
[pg_restore PostgreSQL 18](https://www.postgresql.org/docs/18/app-pgrestore.html),
[backup direto Neon](https://neon.com/docs/manage/backup-pg-dump).
