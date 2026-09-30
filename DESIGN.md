---
name: gerenCIA
description: Análise financeira pessoal com clareza, contexto e continuidade.
colors:
  petrol-900: "#103742"
  petrol-950: "#0a2b34"
  petrol-600: "#48676e"
  mint-200: "#a7e5d6"
  mint-100: "#d9eee7"
  sage-100: "#e7efe8"
  cream-50: "#f5f5ef"
  teal-700: "#226b63"
  coral-300: "#f2a16b"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(66px, 6.65vw, 96px)"
    fontWeight: 400
    lineHeight: 0.93
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(48px, 5.4vw, 76px)"
    fontWeight: 400
    lineHeight: 1
  uiHeading:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontWeight: 600
  body:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "DM Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
rounded:
  control: "5px"
  panel: "8px"
spacing:
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
components:
  button-primary:
    backgroundColor: "{colors.mint-200}"
    textColor: "{colors.petrol-900}"
    rounded: "{rounded.control}"
    height: "54px"
    padding: "13px 22px"
  button-primary-hover:
    backgroundColor: "#c9f6e9"
    textColor: "{colors.petrol-900}"
    rounded: "{rounded.control}"
  dashboard-panel:
    backgroundColor: "#10343c"
    textColor: "#f2f7f1"
    rounded: "{rounded.panel}"
---

# Design System: gerenCIA

## Overview

**Creative North Star: “Do arquivo à clareza”**

A abertura apresenta a calculadorazinha como mascote da marca. Dois arquivos fictícios podem ser arrastados até sua boca ou acionados por toque e teclado; ela mastiga os números e revela uma leitura ilustrativa. A análise completa continua nas descobertas e na demonstração.

**Key Characteristics:** petróleo e menta; personagem vetorial próprio; movimento breve com propósito; cartões de arquivo em papel mineral; resultado claro e preciso. Cores distintas por mês e categoria ficam nas áreas analíticas. O nome e o símbolo do produto permanecem.

## Colors

O petróleo profundo ancora a primeira dobra e a seção da demonstração. Menta indica ação e foco narrativo; o coral marca o foco em superfícies escuras, e o teal marca o foco nas áreas claras. A área analítica usa camadas de petróleo, com métricas em alto contraste e sem fundos brancos.

- **Petróleo** (`#103742` e `#0a2b34`): estrutura, cabeçalho da análise e texto principal.
- **Menta** (`#a7e5d6`): ação principal, estado selecionado e destaque do título.
- **Petróleo analítico** (`#10343c`, `#173f47` e `#1e4b53`): superfícies dos gráficos e métricas.
- **Papel quente** (`#f5f5ef`): pausa entre trechos da narrativa.
- **Coral** (`#f2a16b`): foco em petróleo. **Teal** (`#226b63`): foco nas superfícies claras.

As cores das categorias sempre aparecem junto de nomes e valores. Tokens gerais estão em `frontend/src/styles/tokens.css`; os tokens da superfície ficam em `frontend/src/styles/premium.css`.

## Typography

**Display:** Instrument Serif regular, com itálico apenas no foco do título principal. **Interface e dados:** DM Sans, pesos 400 a 700. As duas famílias são servidas localmente em WOFF2, com `font-display: swap` e alternativas de sistema.

A serifa dá caráter editorial à apresentação, enquanto a sans mantém controles, tabelas e números estáveis. O título principal chega a 96 px; títulos de seção a 76 px. O corpo parte de 16 px. Valores e comparações usam algarismos tabulares.

## Layout

O contêiner chega a 1360 px e conserva margens fluidas. A primeira tela coloca a mensagem à esquerda e a cena do mascote à direita; em telas estreitas, texto, arquivos, personagem e resultado seguem uma única coluna. Os recortes de 320, 390, 768 e 1440 px foram inspecionados. O ritmo base usa 8, 12, 16, 24 e 32 px, com espaço maior entre seções. Âncoras reservam espaço para a navegação.

## Elevation & Depth

O mascote é um desenho vetorial da própria interface: corpo de calculadora em menta, tela facial em petróleo e uma boca que recebe os arquivos de exemplo. O arrasto desloca o cartão até a boca; a mastigação dura pouco mais de um segundo, seguida da entrada do card de insight. Toque ou clique no arquivo oferecem a mesma ação sem arrasto. A preferência por movimento reduzido apresenta o resultado sem animação.

A demonstração usa uma sombra discreta e camadas de petróleo. As métricas resumem totais e variação mensal; a análise por categoria usa barras com rótulos diretos e uma lista selecionável.

## Shapes

Controles principais usam cantos de 5 px, grandes painéis 8 px e os índices das etapas permanecem circulares. Linhas finas e áreas de cor separam dados sem multiplicar cartões.

## Components

- **Botão principal:** menta sobre petróleo, altura mínima de 54 px, hover mais claro e foco coral de 3 px.
- **Hero do mascote:** dois arquivos cenográficos, arrasto para a boca, alternativa por clique/toque/teclado, reação de mastigação, card de resultado e reinício.
- **Carrossel de descobertas:** três perspectivas manuais com botões, teclado e toque; cada uma abre o recorte correspondente na demonstração.
- **Dashboard:** cabeçalho petróleo, filtros de período, métricas em petróleo, comparação de variações mês a mês, barras ou rosca por categoria, lista de valores e lançamentos exemplares.
- **Links das descobertas:** abrem período, categoria e tipo de gráfico na URL; o recorte sobrevive à recarga.
- **Navegação móvel:** botão expande o menu; Escape fecha e devolve foco.

## Do's and Don'ts

- Derive textos, totais, variações e percentuais de `demoData.ts` via `demoModel.ts`.
- Mostre os valores em texto junto dos gráficos; mantenha controles de teclado, foco visível e movimento reduzido.
- Indique que os arquivos da abertura e os dados da demonstração são fictícios. Nenhum PDF ou CSV real é enviado ou analisado. Os lançamentos exibidos são exemplos e não formam extrato completo.
- Descreva autenticação e importação como funcionalidades em desenvolvimento.
- Evite alegações comerciais ou resultados não documentados.
