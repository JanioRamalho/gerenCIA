# Gerencia

Aplicação web de gestão e análise financeira baseada em faturas CSV e XLSX.

O frontend já oferece uma demonstração interativa com dados fictícios. A API
possui rotas de saúde, verificação do banco e consulta de categorias; os demais recursos serão construídos por etapas, com
o backend desenvolvido de forma acompanhada e didática.

## Arquitetura

React e Recharts formam a interface; FastAPI concentra os casos de uso,
o processamento de faturas e o acesso ao PostgreSQL.

Comece pelo [mapa da arquitetura com diagramas Mermaid](docs/arquitetura.md).
Ele mostra as responsabilidades, o caminho de uma fatura e o estado atual.
O [planejamento completo](docs/planejamento-gerencia.txt) detalha os requisitos.

## Diretórios

- backend/: API, domínio financeiro, pipeline, persistência, IA e testes.
- frontend/: aplicação React, funcionalidades, componentes e testes.
- docs/: planejamento do produto e da arquitetura.
- scripts/: tarefas auxiliares de desenvolvimento.

## Ordem prevista

1. Fundação do backend e banco.
2. Autenticação e isolamento por usuário.
3. Upload e camada Bronze.
4. Transformações Silver e qualidade.
5. Categorização e Gold.
6. Frontend React e dashboards Recharts.
7. Recorrências e calendário.
8. Assistente com IA.
9. Integração, testes e empacotamento.

O mapa da arquitetura distingue as funcionalidades existentes das etapas previstas.

## Como iniciar a API

No PowerShell, a partir da pasta principal do projeto, execute sempre que quiser usar a API localmente:

~~~powershell
.\.venv\Scripts\python.exe -m uvicorn app.api.main:app --app-dir backend --reload
~~~

Deixe o terminal aberto enquanto usa a API. Acesse http://127.0.0.1:8000/api/health para verificar a resposta {"status":"ok"} ou http://127.0.0.1:8000/docs para abrir a documentação automática. Para parar o servidor, pressione Ctrl+C.

O comando usa o ambiente virtual .venv da pasta principal, com FastAPI e Uvicorn instalados. A conexão com PostgreSQL exige `DATABASE_URL` no `.env` e o driver `psycopg` no ambiente Python. Com a API no ar, o `npm run dev` do frontend encaminha `/api` para `http://127.0.0.1:8000`; para apontar para outro endereço, defina `GERENCIA_API_URL`. Cadastro e login funcionam de verdade; a análise financeira ainda usa dados de demonstração.

## Banco de dados

O script `scripts/init.sql` cria o esquema e as categorias iniciais em um banco
PostgreSQL 18 vazio. Ele não cria o banco em si. Consulte o
[guia de instalação, atualização e testes](docs/database-setup.md).

## Como iniciar o frontend

No terminal, a partir da pasta principal do projeto, execute:

```bash
cd frontend
npm install
npm run dev
```

Em seguida, abra no navegador o endereço exibido pelo terminal, normalmente `http://localhost:5173`.
