# Gerencia

Aplicação web de gestão e análise financeira baseada em faturas CSV e XLSX.

Este repositório contém apenas a arquitetura inicial do projeto. A implementação
será construída por etapas, com o backend desenvolvido de forma acompanhada e
didática.

## Arquitetura

    frontend React + Recharts
            |
            v
    backend FastAPI
            |
            +-- autenticação e APIs
            +-- pipeline Raw / Bronze / Silver / Gold
            +-- qualidade de dados
            +-- analytics e recorrências
            +-- integração com IA
            |
            v
    PostgreSQL

## Diretórios

- backend/: API, domínio financeiro, pipeline, persistência, IA e testes.
- frontend/: aplicação React, funcionalidades, componentes e testes.
- data/: arquivos locais de desenvolvimento e amostras fictícias.
- docs/: planejamento, decisões arquiteturais e documentação.
- infra/: Docker e demais arquivos de infraestrutura, quando implementados.
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

O planejamento detalhado está em docs/planejamento-gerencia.txt.

## Como iniciar o frontend

No terminal, a partir da pasta principal do projeto, execute:

```bash
cd frontend
npm install
npm run dev
```

Em seguida, abra no navegador o endereço exibido pelo terminal, normalmente `http://localhost:5173`.
