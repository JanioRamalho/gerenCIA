# Frontend

A página inicial apresenta o projeto e inclui uma demonstração interativa de gastos por categoria com Recharts. Os dados exibidos são fictícios (junho a agosto de 2026).

## Executar localmente

```bash
cd frontend
npm install
npm run dev
```

Use `npm run build` para gerar a versão de produção. As rotas `/login` e `/register` mostram uma página informativa até a autenticação ser implementada.

## Responsabilidades

- src/app/: inicialização, rotas e providers globais.
- src/pages/: composição das páginas.
- src/features/: funcionalidades organizadas por domínio.
- src/components/ui/: componentes visuais reutilizáveis.
- src/components/dashboard/: cards e gráficos Recharts.
- src/services/: comunicação tipada com a API.
- src/hooks/: hooks reutilizáveis.
- src/types/: contratos compartilhados no frontend.
- src/styles/: tokens e estilos globais.
- tests/: configuração e utilidades de testes.

O frontend apresentará métricas recebidas da API. Cálculos financeiros e regras
de autorização permanecerão no backend.
