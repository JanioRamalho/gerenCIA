# Revisão das alterações — 12/11/2026

## Resultado

As alterações são úteis para a etapa atual: versionar o banco com Alembic,
manter upload e histórico funcionais e preparar a conta sem transações com
estados vazios. A implementação alternativa de upload não era compatível
com a segunda versão que entrou na `main`; foi retirada desta entrega.

A referência revisada da `main` foi `d741130`, merge do PR #2, que contém
o commit `5d6550f` ("Segunda versão: análise de fatura, painel e upload").
Ela acrescentou `/api/dashboard`, análise de faturas, upload com corpo bruto,
histórico, filtros e gráficos com dados da conta. Essa versão foi integrada
somente à branch `feat/alembic-upload-historico`, sem modificar a `main`.

## O que foi preservado e corrigido

| Grupo | Decisão e efeito |
|---|---|
| Análises e gráficos existentes | `pipeline/analise.py`, `pipeline/previa.py`, `PanelDashboard.tsx` e `FilesSection.tsx` foram preservados da main. Nenhuma nova análise foi desenvolvida nesta revisão. |
| Alembic | Mantidas as revisões `0001_baseline` e `0002_upload_history`, o snapshot SQL e o script de adoção. Modelos alinhados ao esquema, incluindo índices e tipos. |
| Instalação do banco | O comando antigo `scripts/instalar_banco.py` agora delega ao Alembic; deixa de criar um esquema sem registrar sua versão. |
| Histórico anterior | O serviço lê tanto os resumos da main como os campos dos registros importados pela implementação local anterior; preserva formato, período e totais disponíveis. |
| Arquivo original | Novos registros usam `storage_path=None`, permitido pelo Alembic, sem inventar um caminho para um arquivo que não é guardado. |
| Conta sem transações | `PanelHome` e `PanelEmptyState` exibem travessões e explicam o primeiro envio. Quando existem transações, `PanelOverview` mantém o dashboard analítico da main. |
| Endereços | `/app/files` é o caminho principal; `/app/uploads` abre a mesma tela e mantém o item Arquivos ativo. |
| Cliente HTTP | Arquivos e dashboard reutilizam `auth/api.ts`, incluindo cookies e tratamento de erros; consultas canceladas não atualizam a tela. |
| Carregamento | Painel e prévia são carregados sob demanda. O arquivo JavaScript de entrada caiu de aproximadamente 630 kB para 280 kB nesta revisão, sem gzip. |
| Celular | Corrigidos o tamanho mínimo da grade, o campo de arquivo e o contêiner das tabelas. A rolagem horizontal das tabelas fica dentro do cartão. |
| Configuração | Removida uma credencial real que estava na cópia local do `.env.example`, antes de qualquer commit. `.env` e `.env.neon` continuam fora do Git. |

## Limpeza

- Retirada a alternativa de leitura/importação (`imports.py`, `money.py`,
  `readers.py`) e seus testes específicos, pois duplicavam o fluxo mantido
  da main. Os testes existentes da main e de migrações foram preservados.
- Retirados `UploadsSection.tsx`, `src/uploads/api.ts` e `uploads.css`, que
  dependiam do contrato multipart substituído. Não ficou uma segunda tela
  de arquivos sem rota ou uma segunda API de upload.
- O dashboard alternativo e os arquivos conflitantes de upload foram
  resguardados localmente em
  `.impeccable/review/revisao-2026-11-12/alternativa-upload.zip`, fora do Git.
- Removido o `package-lock.json` vazio da raiz, que não tinha um
  `package.json` correspondente. O lockfile real de `frontend/` foi mantido.
- Removidos estilos sem consumidor, dependência `python-multipart`, captura
  de depuração e caches antigos de pytest. Antes da remoção dos diretórios
  temporários, foi conferido que não continham PostgreSQL em execução.
- Atualizados README, arquitetura, produto e direção visual para não
  descrever as análises da main como se ainda não existissem.

O protótipo solicitado permanece em `.impeccable/prototypes/`, separado do
produto e identificado como simulação. A janela de envio proposta ainda
não foi aplicada à aplicação.

## Validação desta revisão

- `npm run build`: TypeScript e Vite concluídos, sem aviso de chunk acima
  de 500 kB após o carregamento sob demanda.
- Sintaxe dos arquivos Python de `backend/` e `scripts/` conferida.
- PostgreSQL temporário local criado pelo Alembic; `alembic check` não
  encontrou operações novas em relação aos modelos.
- Fluxo real em banco temporário: cadastro, painel vazio, `/app/uploads`,
  envio de CSV fictício, histórico, dashboard com dados e exclusão.
- Playwright em Chrome: painéis vazio e com dados em 1440 e 390 px, e
  arquivos em 390 px, sem transbordamento da página nem erros JavaScript.
- `git diff --check`: sem problemas; nenhum conflito pendente.
- Varredura dos arquivos da entrega por padrões de tokens: nenhum
  resultado. Configurações locais e artefatos continuam ignorados.

Não foram escritos nem executados testes unitários. O banco temporário e
os processos usados nesta validação foram encerrados e removidos. O Neon
não foi acessado nem alterado nesta revisão. A adoção no Neon em
`0002_upload_history` foi validada na etapa anterior e está registrada no
[guia do banco](database-setup.md).

O Alembic emitiu um `SAWarning` de reflexão com a chave `dialect_options`.
A comparação terminou sem diferenças; o aviso fica registrado para uma
revisão das bibliotecas, sem ocultá-lo ou alterar o esquema por causa dele.

## Limites da entrega

A versão atual da main ainda não cobre todos os requisitos do planejamento:
regras pessoais de categorização, identificação entre extratos sobrepostos,
relatório completo de qualidade e algumas medidas descritivas precisam de
uma etapa própria. Downloads e relatório detalhado da implementação
alternativa não foram portados para a main nesta revisão. Limites,
notificações, exclusão da conta e IA continuam fora desta entrega.

O código de aplicação permanece em nível intermediário: funções e
componentes com responsabilidades definidas, sem introduzir novos serviços
ou frameworks. SQLAlchemy, regras de integridade e adoção do banco são os
trechos mais técnicos; são necessários para preservar dados e devem ser
explicados com apoio do guia, sem tratar isso como código básico.

## Entrega por branch

A branch contém os cinco commits anteriores de organização e clareza,
a integração da main e os commits desta revisão. As mensagens e a divisão
por assunto estão em [mensagens-commit.md](mensagens-commit.md).

A publicação desta entrega deve enviar somente
`feat/alembic-upload-historico` e abrir um pull request para `main`.
O merge fica com o usuário; não deve ser habilitado merge automático.
