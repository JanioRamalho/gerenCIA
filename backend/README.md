# Backend

Área reservada para a aplicação Python/FastAPI. Nenhum código funcional foi
iniciado nesta reorganização.

## Responsabilidades

- app/api/: rotas HTTP e dependências de autenticação.
- app/core/: configuração, segurança, exceções e logging.
- app/db/: sessão SQLAlchemy, base ORM e acesso ao PostgreSQL.
- app/models/: modelos persistidos.
- app/schemas/: contratos Pydantic de entrada e saída.
- app/repositories/: consultas ao banco sempre limitadas pelo usuário.
- app/services/: casos de uso e regras da aplicação.
- app/pipeline/: ingestão e camadas Bronze, Silver e Gold.
- app/ai/: cliente OpenAI, ferramentas financeiras e orquestração.
- migrations/: migrações Alembic.
- tests/: testes unitários, integração e fixtures.

## Regra de dependência

    API -> Services -> Repositories -> Models/Database
                     -> Pipeline
                     -> AI tools

Rotas não deverão conter transformações Pandas, consultas SQL diretas ou
cálculos financeiros. O pipeline não deverá depender do FastAPI.
