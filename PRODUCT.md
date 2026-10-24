# gerenCIA

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pessoas físicas que querem compreender despesas, hábitos e prioridades a partir de extratos bancários e faturas de cartão.

O gerenCIA é um projeto acadêmico. Uma banca avalia o site e o painel ao vivo, num projetor, e depois em notebooks e celulares; ela julga clareza, honestidade das informações e qualidade de execução, não conversão.

## Product Purpose

O gerenCIA pretende transformar extratos bancários e faturas de cartão, em CSV e XLSX, em informações financeiras organizadas e fáceis de analisar. A experiência deve ajudar a pessoa a acompanhar períodos, entender categorias e examinar os lançamentos que compõem cada total. Um diagnóstico mensal gerado por IA explica os gastos em linguagem simples e sugere onde economizar, a partir das análises calculadas pelo sistema.

## Positioning

O percurso planejado liga o arquivo de origem à revisão dos dados e à análise financeira. Na versão atual, uma demonstração pública permite experimentar parte da análise antes da integração com contas e arquivos reais.

## Operating Context

O frontend é uma aplicação React, TypeScript e Vite. Os gráficos interativos usam Recharts. A demonstração atual usa valores fictícios de junho, julho e agosto de 2026, com o conjunto completo de lançamentos de cada mês.

## Capabilities and Constraints

- A página pública e os gráficos demonstrativos funcionam sem cadastro.
- Cadastro e login funcionam: a conta é criada com nome, e-mail e senha, e a sessão fica num cookie do navegador. Importação de extratos e faturas e análise de dados pessoais ainda estão em desenvolvimento, e a conta ainda não guarda nenhum arquivo.
- Cada total por categoria é a soma exata dos lançamentos fictícios do período, e a demonstração mostra essa conciliação.
- Cálculos financeiros e regras de autorização dos dados reais pertencerão ao backend.
- Planejado: limites mensais opcionais por categoria. Ao chegar a 80% e ao passar de 100% do limite no mês corrente, um aviso aparece no sino de notificações do painel, uma vez por faixa, categoria e mês.

## Brand Commitments

Preservar o nome gerenCIA, seu símbolo de três barras ascendentes e a referência visual às cores petróleo e menta. A linguagem deve ser direta, clara e adequada a decisões financeiras pessoais.

O painel do usuário segue o padrão conhecido dos apps de finanças pessoais, sem metáfora visual: um número principal do mês, poucas informações por tela e o detalhe a um clique. As referências de conteúdo escolhidas em 2026-10-24 são o Nubank, o Organizze e o Copilot Money. A referência visual, escolhida no mesmo dia, é o kit FINEbank.IO (Figma) e painéis de finanças do Dribbble: barra lateral escura com o item ativo preenchido, topo com saudação e data, grade de cartões brancos com o título de cada bloco fora do cartão, medidor dos limites, próximas cobranças com a data em destaque e blocos por categoria com seta de alta ou queda, nas cores do gerenCIA.

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
