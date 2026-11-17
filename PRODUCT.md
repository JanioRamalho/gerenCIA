# gerenCIA

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pessoas físicas que querem compreender despesas, hábitos e prioridades a partir de extratos bancários e faturas de cartão.

O gerenCIA é um projeto acadêmico. Uma banca avalia o site e o painel ao vivo, num projetor, e depois em notebooks e celulares; ela julga clareza, honestidade das informações e qualidade de execução, não conversão.

## Product Purpose

O gerenCIA pretende transformar extratos bancários e faturas de cartão, em CSV e XLSX, em informações financeiras organizadas e fáceis de analisar. A experiência deve ajudar a pessoa a acompanhar períodos, entender categorias e examinar os lançamentos que compõem cada total. IA, treinamento e predição estão fora da etapa atual por decisão do usuário em 17/11/2026.

## Positioning

O percurso planejado liga o arquivo de origem à revisão dos dados e à análise financeira. Na versão atual, uma demonstração pública permite experimentar parte da análise sem cadastro; a área interna usa arquivos da pessoa autenticada.

## Operating Context

O frontend é uma aplicação React, TypeScript e Vite. Os gráficos interativos usam Recharts. A demonstração atual usa valores fictícios de junho, julho e agosto de 2026, com o conjunto completo de lançamentos de cada mês.

## Capabilities and Constraints

- A página pública e os gráficos demonstrativos funcionam sem cadastro.
- Cadastro e login funcionam: a conta é criada com nome, e-mail e senha, e a sessão fica num cookie do navegador. A área interna reúne importação CSV/XLSX, qualidade, análises, transações, limites, avisos e exclusão da própria conta.
- Cada total por categoria é a soma exata dos lançamentos fictícios do período, e a demonstração mostra essa conciliação.
- Cálculos financeiros e regras de autorização dos dados reais ficam no backend.
- Limites mensais opcionais por categoria. Ao chegar a 80% e ao passar de 100% do limite no mês corrente, um aviso aparece no sino de notificações do painel, uma vez por faixa, categoria e mês.

## Brand Commitments

Preservar o nome gerenCIA, seu símbolo de três barras ascendentes e a referência visual às cores petróleo e menta. A linguagem deve ser direta, clara e adequada a decisões financeiras pessoais.

A direção aprovada em 16/11/2026 é **Categorias em destaque**: tema claro, navegação petróleo, categorias com cores e ícones, distribuição do gasto como centro do Painel, comparação livre ao lado e detalhes abaixo. Assinaturas e recorrências têm resumo com gráfico e detalhes ao clicar. Apenas cinco lançamentos recentes ficam no Painel; a investigação completa acontece em Transações.

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
