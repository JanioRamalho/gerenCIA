# gerenCIA

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pessoas físicas que querem compreender despesas, hábitos e prioridades a partir de faturas financeiras.

## Product Purpose

O gerenCIA pretende transformar faturas CSV e XLSX em informações financeiras organizadas e fáceis de analisar. A experiência deve ajudar a pessoa a acompanhar períodos, entender categorias e examinar os lançamentos que compõem cada total.

## Positioning

O percurso planejado liga o arquivo de origem à revisão dos dados e à análise financeira. Na versão atual, uma demonstração pública permite experimentar parte da análise antes da integração com contas e arquivos reais.

## Operating Context

O frontend é uma aplicação React, TypeScript e Vite. Os gráficos interativos usam Recharts. A demonstração atual usa valores fictícios de junho, julho e agosto de 2026, com alguns lançamentos exemplares por mês.

## Capabilities and Constraints

- A página pública e os gráficos demonstrativos funcionam sem cadastro.
- Autenticação, importação de faturas e análise de dados pessoais ainda estão em desenvolvimento. `/register` demonstra um formulário com validação local, sem enviar ou salvar dados; `/login` é uma página informativa.
- Os totais por categoria não representam a soma apenas dos lançamentos exibidos; estes são exemplos de um conjunto fictício maior.
- Cálculos financeiros e regras de autorização dos dados reais pertencerão ao backend.

## Brand Commitments

Preservar o nome gerenCIA, seu símbolo de três barras ascendentes e a referência visual às cores petróleo e menta. A linguagem deve ser direta, clara e adequada a decisões financeiras pessoais.

## Evidence on Hand

- `frontend/src/components/dashboard/demoData.ts`: meses, categorias, totais e lançamentos demonstrativos.
- `DESIGN.md`: direção visual e componentes da experiência atual.
- `docs/planejamento-gerencia.txt`: objetivo e arquitetura previstos.

Não há depoimentos, clientes, resultados comerciais ou análises de contas reais para apresentar como prova.

## Product Principles

1. Mostrar de onde vêm os totais e o que cada visualização representa.
2. Manter a mesma história demonstrativa ao passar da apresentação aos gráficos.
3. Distinguir funcionalidades disponíveis das planejadas.
4. Oferecer a mesma informação sem depender de cor, animação ou 3D.
