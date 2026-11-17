# Backend

API FastAPI com sessão por cookie, processamento síncrono CSV/XLSX e PostgreSQL.
Consulte o README principal para executar e `docs/database-setup.md` para migrar.

## Rotas principais

| Rota | Função |
| --- | --- |
| `POST /api/auth/register` | Cadastro e abertura da sessão |
| `POST /api/auth/login`, `logout` | Entrada e encerramento da sessão |
| `GET /api/auth/me`, `DELETE /api/auth/me` | Conta atual e exclusão dos próprios dados |
| `GET /api/categories` | Categorias globais e próprias disponíveis |
| `POST /api/uploads?nome=...&document_type=extrato` | Corpo bruto CSV/XLSX, até 4 MB; tipo obrigatório para planilha-modelo |
| `GET /api/uploads`, `GET /api/uploads/{id}` | Histórico e qualidade/rejeições |
| `GET /api/uploads/{id}/rejections.csv` | Rejeições exportáveis |
| `DELETE /api/uploads/{id}` | Exclusão e reavaliação das cópias restantes |
| `GET /api/transactions`, `GET /api/transactions/{id}` | Filtros/paginação e origem |
| `PATCH /api/transactions/{id}/category` | Correção e regra pessoal futura opcional |
| `GET /api/analytics/summary` | Análise do período e comparação livre |
| `GET /api/budgets?month=AAAA-MM` | Limites e gasto efetivo por categoria |
| `PUT /api/budgets/{category_id}`, `DELETE ...` | Definir e desativar limite mensal |
| `GET /api/notifications`, `POST .../read-all`, `POST .../{id}/read` | Avisos e leitura |
| `GET /api/health`, `GET /api/health/database` | Saúde da aplicação e banco |

O OpenAPI em `/docs` detalha filtros e contratos. Rotas financeiras exigem sessão;
recursos de outro usuário respondem 404. A consulta de categorias globais é pública.
`/api/dashboard` permanece como adaptador de compatibilidade.

## Regras

Dinheiro usa Decimal e centavos inteiros nos cálculos. Novos DTOs financeiros
serializam valores monetários como texto decimal. O frontend formata os valores,
sem recalcular regras financeiras. Percentuais têm base explícita; ausência de dados
não vira zero. `month` aceita `latest`, `all` ou `AAAA-MM`; comparação mensal exige
dois meses distintos e disponíveis. Filtros e agregados precedem a paginação.

Upload, duplicidade, categoria, limites e avisos usam transações curtas com bloqueio
por usuário. O reenvio do mesmo conteúdo retorna o arquivo existente (200, `reused`);
um envio novo retorna 201. IDs bancários conflitantes abortam o envio inteiro.
Sem ID confirmado, semelhança gera suspeita e não exclui valores automaticamente.

O limite gera aviso ao atingir 80% e ao ultrapassar 100% no mês corrente, uma vez
por categoria/mês/faixa. A desativação mantém a memória de avisos.

## Organização

`API → Serviços → Repositórios → Modelos/Banco`; serviços coordenam também o
pipeline puro. Rotas não contêm pandas, SQL ou fórmulas financeiras. Categorias
usam serviço e repositório. O pipeline não depende de FastAPI.

Sessões usam token aleatório, cookie HttpOnly/SameSite=Lax e hash SHA-256 no banco.
Senhas usam scrypt com sal. Configure `APP_ENV=production` e cookie Secure em HTTPS.
Não há recuperação de senha nem limite de tentativas de login nesta versão.
IA não integra esta etapa.

Migrações Alembic são explícitas e preservam a baseline histórica. Não use
`Base.metadata.create_all()` para instalar o esquema: ele não cria os triggers.
Testes usam PostgreSQL descartável e não leem o banco de uso. Ferramentas de teste
ficam em `requirements.txt` na raiz; `backend/requirements.txt` contém produção.
