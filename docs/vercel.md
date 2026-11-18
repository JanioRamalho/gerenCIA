# Publicação na Vercel

Destino confirmado pelo usuário em 17/11/2026. Esta configuração não comprova
que uma versão tenha sido publicada: a validação hospedada é uma etapa separada.

Projeto informado: `janioramalho12-2999/gerencia`; site existente
[gerencia-liart.vercel.app](https://gerencia-liart.vercel.app/). Em 17/11, a página
e as duas rotas de saúde responderam 200. O frontend `bf2efca`, na branch `Janio`,
foi compilado também no deploy protegido `dpl_6WEHasHq1aCxrRvMVLzXffboijbG`, sem
promoção ao domínio público: a importação encontrou a coluna
`uploads.source_format` ausente no PostgreSQL hospedado. Não foram executadas
migrações. A publicação depende da preparação e autorização da compatibilidade
do banco; veja [a validação visual](validacao-visual-2026-11-17.md).

O usuário autorizou somente preparar o banco, sem aplicar em produção.
O [procedimento de backup e ensaio](preparacao-banco-2026-11-17.md) foi testado
com PostgreSQL descartável; a captura real aguarda conexão direta do Neon
configurada localmente. Nenhum teste sintético substitui essa validação real.

O `vercel.json` da raiz declara dois serviços: Vite em `frontend/` e FastAPI em
`backend/`, com entrada `main:app`. Os rewrites enviam `/api/...` à API e o restante
ao frontend. O rewrite interno do Vite entrega `index.html` para deep links como
`/app/files`. O prefixo `/api` é preservado, como esperado pelas rotas.
Esse formato segue o [guia oficial de Vercel Services](https://vercel.com/kb/guide/vercel-services).

## Preparação

1. No projeto da Vercel, confira a disponibilidade e a ativação de **Framework
   Services** antes de usar a configuração declarada. A raiz do projeto é a raiz
   do repositório. A branch de revisão é `Janio`; preserve a `main`.
2. Configure PostgreSQL externo e conexão TLS conforme o provedor. No backend,
   defina `DATABASE_URL` com o driver `postgresql+psycopg`, `APP_ENV=production`
   e `SESSION_COOKIE_SECURE=true`. `SESSION_TTL_DAYS` é opcional (padrão 14).
   Credenciais não entram em variáveis `VITE_*`, no frontend ou em arquivos versionados.
3. Para banco novo, execute explicitamente `alembic upgrade head` com as ferramentas
   da raiz. Para banco existente, siga o [guia do banco](database-setup.md): backup,
   revisão atual, conferência e janela sem escrita. Migração não roda no startup
   da função nem no build do frontend. Não aplique revisões a um banco de uso
   apenas para testar a hospedagem.
4. Gere um Preview da versão validada e execute o percurso abaixo antes de
   promovê-lo. A publicação deve usar o projeto e ambiente corretos.

## Limites e persistência

O produto aceita arquivos de até **4 MB**, abaixo do limite de payload de 4,5 MB
documentado para [Vercel Functions](https://vercel.com/docs/functions/limitations).
O arquivo chega como corpo bruto, sem multipart. Arquivos maiores precisam ser
reduzidos; não foi acrescentado armazenamento externo de originais.

Pandas processa cada arquivo durante a requisição. Transações, qualidade, rejeições,
sessões, limites e avisos ficam no PostgreSQL; disco temporário da função não é
persistência. Verifique duração e tamanho do bundle no deploy, pois build local
não mede os limites da função hospedada.

Frontend e API devem permanecer na mesma origem HTTPS para o cookie de sessão.
`GERENCIA_API_URL` serve ao proxy do Vite local e não deve apontar o frontend
publicado para outra origem.

## Conferência após o deploy

- `/api/health` e `/api/health/database` respondem com sucesso.
- Cadastro/login funcionam, cookie tem HttpOnly, Secure e SameSite=Lax; logout
  invalida a sessão. Reabrir `/app/files` diretamente mantém o roteamento.
- Envio do exemplo CSV/XLSX, detalhe da qualidade, comparação, filtros, correção,
  limite e leitura de aviso funcionam. Reenvio não duplica o mesmo conteúdo.
- Após nova invocação/deploy, a conta e os dados persistem no PostgreSQL.
- Uma segunda conta não vê os dados da primeira; exclusão afeta apenas os próprios.

Use contas e arquivos fictícios para o ensaio. Registre URL/revisão e resultado
sem credenciais. IA não faz parte desta publicação.
