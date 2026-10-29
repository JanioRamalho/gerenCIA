# Backend

A aplicação FastAPI tem as rotas GET /api/health, GET /api/health/database,
GET /api/categories e as de autenticação abaixo. Há conexão PostgreSQL e
modelos SQLAlchemy; o processamento de extratos e faturas ainda será implementado.
Consulte o README principal para o comando de inicialização da API.

## Autenticação

| Rota | O que faz |
|---|---|
| POST /api/auth/register | Cria a conta (nome, e-mail e senha) e já abre a sessão. 409 se o e-mail já existe |
| POST /api/auth/login | Abre a sessão. 401 com a mesma mensagem para e-mail desconhecido e senha errada |
| POST /api/auth/logout | Revoga a sessão no banco e apaga o cookie. Sempre responde 204 |
| GET /api/auth/me | Devolve o usuário da sessão, ou 401 |

- A senha é guardada só como hash scrypt com sal próprio (`app/core/security.py`);
  a verificação usa comparação em tempo constante e roda mesmo para e-mail
  desconhecido, para o tempo de resposta não revelar quem tem conta.
- A sessão é um token aleatório num cookie `gerencia_session` (`HttpOnly`,
  `SameSite=Lax`, e `Secure` quando `APP_ENV=production`). O banco guarda só o
  SHA-256 do token, com validade e data de revogação.
- O usuário sempre vem da sessão. Para proteger uma rota nova, use a dependência
  `get_current_user` de `app/api/deps.py`; nenhuma rota recebe `user_id` do cliente.
- Erros de validação voltam como `{"detail": ..., "fields": {campo: mensagem}}`,
  em português, para o frontend mostrar junto de cada campo.
- Configuração opcional no `.env`: `SESSION_TTL_DAYS` (padrão 14; um valor que
  não seja um número inteiro maior que zero impede a API de subir, com uma
  mensagem dizendo o que corrigir) e `SESSION_COOKIE_SECURE` (padrão `true` só
  em produção). Todas as variáveis são lidas em `app/core/config.py`.

Ainda não há limite de tentativas de login, e-mail de confirmação nem
recuperação de senha.

O [mapa da arquitetura](../docs/arquitetura.md) mostra o fluxo completo e as
responsabilidades de cada módulo. A consulta de categorias fica em
`app/repositories/categories.py`; ela não tem serviço porque ainda não tem
regra de negócio, só a consulta.

## Banco e verificações

O esquema completo é instalado por `scripts/init.sql`, com 10 tabelas,
proteções de integridade e categorias globais iniciais. A configuração e a
atualização de bancos existentes estão no [guia do banco](../docs/database-setup.md).

Todas as tabelas têm um `code` numérico automático para consulta e mantêm
`id` UUID como chave primária. O endpoint de categorias retorna os dois campos.

Os modelos mapeiam esse esquema. `Base.metadata.create_all()` isoladamente
não instala os triggers que protegem os vínculos com categorias.

Para executar os testes com um PostgreSQL temporário e isolado:

```powershell
.\.venv\Scripts\python.exe -m pytest -o pythonpath=backend backend/tests -q
```

`test_auth.py` testa as rotas de autenticação contra esse mesmo banco
temporário e nunca usa o `DATABASE_URL` do `.env`. Se o Windows negar acesso à
pasta temporária do pytest, acrescente `--basetemp` apontando para uma pasta
sua.

## Responsabilidades previstas

- app/api/: rotas HTTP e dependências de autenticação.
- app/core/: configuração, segurança, exceções e logging.
- app/db/: sessão SQLAlchemy, base ORM e acesso ao PostgreSQL.
- app/models/: modelos persistidos.
- app/schemas/: contratos Pydantic de entrada e saída.
- app/repositories/: consultas ao banco sempre limitadas pelo usuário.
- app/services/: casos de uso e regras da aplicação.
- app/pipeline/: leitura, limpeza, categorização e cálculos das análises.
- app/ai/: resumo do mês enviado à IA, chamada ao provedor e validação da resposta.
- migrations/: migrações Alembic.
- tests/: testes unitários, integração e fixtures.

## Regra de dependência

    API -> Services -> Repositories -> Models/Database
                     -> Pipeline
                     -> AI

Rotas não deverão conter transformações Pandas, consultas SQL diretas ou
cálculos financeiros. O pipeline e a IA não deverão depender do FastAPI. Toda
função do pipeline tem testes unitários com pytest.
