---
name: gerenCIA
description: "Vitrine conciliada, adaptada do modelo Finmax: abertura em petróleo que se acende em menta sobre um chão sálvia com luz medida e o gasto real do trimestre, blocos de ponta a ponta que alternam branco, petróleo e menta, ações em pílula e números que fecham com os lançamentos."
colors:
  night: "#0b2a33"
  night-raised: "#153f4a"
  night-hover: "#1d4f5b"
  night-line: "rgba(238, 245, 242, 0.16)"
  on-night: "#eef5f2"
  on-night-title: "#f6faf8"
  on-night-lead: "#d4e4de"
  on-night-2: "#a9c6c0"
  ink: "#0f3440"
  ink-2: "#45656b"
  mint: "#a7e5d6"
  mint-hover: "#c4f0e4"
  mint-wash: "#ddf3ec"
  mint-deep: "#6fcfb5"
  teal: "#1e6b62"
  ground: "#e3ede8"
  ground-glow: "rgba(167, 229, 214, 0.55)"
  paper: "#ffffff"
  sheet-edge: "#f0f7f3"
  panel: "#eef4f1"
  line: "#cddbd6"
  field-border: "#698388"
  error: "#a3341f"
  error-wash: "#fbeae6"
  glow-petrol: "#10404a"
  glow-teal: "#2a7a70"
  glow-mint: "#8fd6c3"
  glow-haze: "#d4ede4"
  featured-light: "#e9f8f2"
  featured-mid: "#c2ebdf"
  featured-deep: "#b3e6d8"
  closing-light: "#ecf9f4"
  closing-mid: "#c6ede2"
  closing-deep: "#95dcc8"
  stack-back: "#c9dbd4"
  stack-deep: "#8fb3aa"
  bar: "#5b8a88"
  bar-muted: "#b9cdc9"
  cat-alimentacao: "#d4652c"
  cat-transporte: "#00907b"
  cat-lazer: "#6a58c4"
  cat-assinaturas: "#b07e05"
  cat-outros: "#3a78b4"
  month-jun: "#8ab7b0"
  month-jul: "#3f7f79"
  month-ago: "#0f3440"
typography:
  display:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1.35rem + 2.6vw, 3.625rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  heading:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 1.25rem + 1.35vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  stat-numeral:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 2rem + 1.5vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.04em"
    fontFeature: "'tnum' 1"
  numeral:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 1rem + 0.9vw, 1.75rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
    fontFeature: "'tnum' 1"
  title:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 1.1rem + 0.45vw, 1.5rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  subtitle:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 0.98rem + 0.25vw, 1.25rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  intro:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.95rem + 0.25vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.55
  lead:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
  action:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.45
  small:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
  wordmark:
    fontFamily: "Inter Tight, system-ui, sans-serif"
    fontSize: "clamp(3.5rem, 14vw, 11rem)"
    fontWeight: 600
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  code:
    fontFamily: "ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
rounded:
  key: "3px"
  small: "8px"
  control: "12px"
  card: "16px"
  panel: "24px"
  block: "clamp(24px, 2.6vw, 36px)"
  pill: "999px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "24px"
  space-6: "32px"
  space-7: "48px"
  space-8: "64px"
  control-height: "40px"
  container: "1240px"
  container-wide: "1320px"
  gutter: "clamp(16px, 3.4vw, 48px)"
  block-inset: "clamp(8px, 1.2vw, 20px)"
  band-space: "clamp(36px, 4vw, 60px)"
  section-space: "clamp(48px, 5vw, 80px)"
  block-padding: "clamp(24px, 3.6vw, 56px)"
  panel-padding: "clamp(22px, 2.4vw, 32px)"
components:
  button-primary:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 26px"
  button-primary-hover:
    backgroundColor: "{colors.mint-hover}"
    textColor: "{colors.ink}"
  button-primary-night:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 26px"
  button-primary-night-hover:
    backgroundColor: "{colors.night-raised}"
  button-form-submit:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    height: "48px"
    width: "100%"
  button-form-submit-hover:
    backgroundColor: "{colors.night-raised}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    height: "48px"
    padding: "0 26px"
  button-secondary-on-night:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.on-night}"
  button-secondary-on-night-hover:
    backgroundColor: "{colors.night-hover}"
  header-pill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: "44px"
    padding: "0 24px"
  header-pill-hover:
    backgroundColor: "{colors.mint-hover}"
  nav-user:
    textColor: "{colors.on-night}"
    typography: "{typography.body}"
  hero-note:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.on-night-lead}"
    typography: "{typography.small}"
    rounded: "{rounded.control}"
    padding: "10px 20px"
  pill-link:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 20px"
  text-link:
    textColor: "{colors.ink}"
    height: "40px"
  segmented:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "4px"
  segmented-option:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "36px"
    padding: "0 16px"
  segmented-option-hover:
    backgroundColor: "{colors.panel}"
  segmented-option-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  period-option:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    height: "40px"
    padding: "0 18px"
  period-option-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  icon-chip:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    rounded: "50%"
    size: "40px"
  stat-label:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    padding: "3px 24px 3px 3px"
  demo-badge:
    backgroundColor: "{colors.mint-wash}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  input-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "0 16px"
  site-header:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night}"
    height: "68px"
  brand-tile:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    rounded: "11px"
    size: "38px"
  band-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.block}"
    padding: "clamp(24px, 3.6vw, 56px) 0"
  band-night:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night}"
    rounded: "{rounded.block}"
    padding: "clamp(32px, 4.4vw, 64px) 0 clamp(20px, 3.6vw, 56px)"
  ground-chart:
    backgroundColor: "{colors.teal}"
    width: "100%"
    height: "clamp(110px, 13vw, 240px)"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "clamp(12px, 2.2vw, 32px)"
  screen:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "clamp(16px, 2.2vw, 32px)"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "clamp(20px, 2.1vw, 28px)"
  card-featured:
    backgroundColor: "{colors.featured-mid}"
    textColor: "{colors.ink}"
  reading-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-padding}"
  reading-screen:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "16px 16px 0 0"
    padding: "clamp(16px, 1.8vw, 24px)"
  question-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.subtitle}"
    rounded: "{rounded.card}"
    height: "64px"
  closing-panel:
    backgroundColor: "{colors.closing-mid}"
    textColor: "{colors.ink}"
    rounded: "{rounded.block}"
    padding: "clamp(40px, 5.2vw, 72px) clamp(20px, 4vw, 48px)"
  form-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.block}"
    padding: "clamp(22px, 2.6vw, 36px)"
  form-block:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.block}"
    padding: "clamp(22px, 2.6vw, 36px)"
  form-alert:
    backgroundColor: "{colors.error-wash}"
    textColor: "{colors.error}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  planned-list:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.card}"
    padding: "16px 24px"
  float-card:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.on-night}"
    rounded: "{rounded.card}"
    width: "204px"
    padding: "16px 18px"
  float-tag:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "3px 10px"
  statement-tab:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.on-night-2}"
    rounded: "12px 12px 0 0"
    height: "52px"
    padding: "0 16px"
  statement-tab-hover:
    backgroundColor: "{colors.night-hover}"
  statement-tab-pressed:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  statement-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "0 16px 16px 16px"
    padding: "clamp(16px, 1.8vw, 24px)"
  cited-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    height: "42px"
    padding: "4px 12px"
  cited-row-hover:
    backgroundColor: "{colors.panel}"
  cited-row-selected:
    backgroundColor: "{colors.mint-wash}"
  note-mark:
    textColor: "{colors.teal}"
    rounded: "6px"
  note-mark-open:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.paper}"
  step-marker:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "50%"
    size: "44px"
  step-marker-available:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
  metric-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
  metric-card-main:
    backgroundColor: "{colors.mint-wash}"
  faq-plus:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.small}"
    size: "26px"
  data-bar:
    backgroundColor: "{colors.bar}"
  data-bar-focus:
    backgroundColor: "{colors.ink}"
  data-bar-muted:
    backgroundColor: "{colors.bar-muted}"
  status-mark-available:
    backgroundColor: "{colors.teal}"
    rounded: "50%"
    size: "10px"
  status-mark-planned:
    backgroundColor: "transparent"
    rounded: "50%"
    size: "10px"
  site-footer:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night-2}"
    rounded: "clamp(24px, 2.6vw, 36px) clamp(24px, 2.6vw, 36px) 0 0"
---

# Design System: gerenCIA

## Overview

**Creative North Star: "A vitrine conciliada"**

O gerenCIA se apresenta como uma vitrine de produto adaptada do modelo Finmax (Webflow), escolhido pelo usuário como referência visual. A abertura em petróleo noturno se acende num brilho menta que desce até um chão sálvia. O chão não é um campo liso: recebe luz medida — poças de menta nas bordas, alternando de lado — e, na base dos números, o gasto diário real do trimestre fictício desenhado quase transparente. Sobre ele, o conteúdo pousa em cartões brancos de sombra suave ou se ergue em blocos arredondados que correm de ponta a ponta da janela, alternando branco, petróleo e menta; toda ação é uma pílula. Do Finmax vêm a gramática e o ritmo: título centrado e pesado, produto subindo da luz entre cartões flutuantes inclinados, cartões de números com um em destaque, um bento de leituras, perguntas em cartões, painel de fechamento em menta e rodapé petróleo de cantos arredondados com o nome gigante. Do gerenCIA vêm o conteúdo, a marca (o símbolo de três barras ascendentes, o petróleo e a menta) e a regra de que todo número exibido fecha com os lançamentos fictícios que o formam.

A peça-assinatura continua sendo a Figura 1, uma pilha de faturas mensais com abas: ela sobe do brilho da abertura entre dois cartões petróleo que trazem números reais da demonstração. Abaixo, a página alterna as superfícies: três cartões de números (o do meio em menta) sobre o gráfico do trimestre, um bloco branco de ponta a ponta para o Problema com a Tabela 1 num painel claro, um cartão branco para o procedimento, o bento da Figura 2 em cartões brancos com telas claras, um bloco petróleo de ponta a ponta para a Demonstração com a Figura 3 numa tela branca, cartões brancos para as perguntas e o painel de fechamento em menta, também de ponta a ponta, antes do rodapé. Em tela muito larga não sobra uma coluna estreita boiando num fundo chapado: os blocos ocupam a largura, e o chão entre eles tem luz e dado. Dentro das telas, a densidade é a de um documento de consulta: réguas finas, rótulos e valores diretos, algarismos tabulares, legenda acima e linha "Fonte:" abaixo.

O acesso é de verdade e vive no mesmo mundo. O /login é o petróleo inteiro em duas colunas: à esquerda o texto e a saída para a demonstração; à direita um bloco branco que pousa sobre o petróleo com a sombra flutuante e guarda o formulário, cujo envio é um botão petróleo de largura total. O /register repete a gramática dos campos sobre o chão sálvia. Quem já entrou é reconhecido no cabeçalho ("Olá, nome" e a pílula "Sair") e numa nota na abertura, e o site público segue inteiro — com a demonstração aberta a todos — mesmo sem conta ou com a API fora do ar.

A adaptação recusa o que o gerenCIA não pode sustentar com verdade: depoimentos, planos e preços, faixa de logotipos de parceiros, captura de e-mail, animação de letras por rolagem e maquete de celular ficam de fora. Também ficam de fora a página branca chapada, o fundo em grade de planilha ou campo de linhas, o texto em degradê, o mascote e as setas em botões. A menta age, seleciona e acende; o petróleo abre, mostra a demonstração e fecha a página.

**Key Characteristics:**
- Abertura em petróleo noturno com título centrado, cujo fundo se acende em menta e se dissolve no chão sálvia.
- Figura 1 (pilha de faturas com abas de mês) subindo do brilho, entre dois cartões petróleo inclinados com números reais.
- Chão sálvia em toda a página, com luz medida (poças de menta nas bordas, alternando de lado) e o gasto diário real do trimestre desenhado a 9% na base dos números.
- O conteúdo pousa em cartões brancos de sombra suave ou em blocos arredondados (24–36px) de ponta a ponta, recuados 8–20px da janela, que alternam branco, petróleo e menta.
- Dentro dos blocos e cartões, painéis claros (24px) e telas brancas (16px); ações em pílula, a principal em menta sobre o petróleo e em petróleo sobre o branco e sobre a menta.
- Acesso real: /login em petróleo com o bloco branco do formulário flutuando à direita; /register no chão sálvia; o cabeçalho e a abertura reconhecem quem entrou, e a área de conta guarda o espaço enquanto a sessão é verificada.
- Uma só família, Inter Tight, com títulos em peso 600 e espaçamento negativo; algarismos tabulares em todo número alinhado.
- Degradês só nos campos de menta, nunca em texto.
- Um único momento de carga (a abertura assenta com deslocamento e desfoque) mais as respostas da Figura 1; com movimento reduzido, nada se move.

## Colors

Chão sálvia com luz medida, petróleo em três momentos, branco para erguer e menta para agir e acender: o petróleo noturno abre a página, recebe a demonstração e fecha no rodapé; o chão sálvia corre por baixo de tudo, acendido só nas bordas; o branco faz blocos, cartões e telas; a menta faz a ação, o dado selecionado e os campos de luz; o teal marca sobre o claro.

### Primary
- **Petróleo Noturno** (#0b2a33): chão do cabeçalho fixo, do topo da abertura, do bloco da Demonstração, do rodapé, da página /login inteira e do menu móvel aberto; fundo do botão de envio dos formulários brancos e do botão principal no campo de menta. É o escopo `.on-night`, onde o foco passa a menta; o bloco branco do formulário do /login, mesmo dentro dele, restaura o foco teal e os links em tinta.
- **Petróleo Erguido** (#153f4a): cartões flutuantes da abertura, abas de mês da Figura 1, a nota de quem entrou na abertura, botão secundário e botão de menu sobre o petróleo, e hover do botão de envio petróleo.
- **Petróleo de Hover** (#1d4f5b): hover das abas de mês e do botão secundário sobre o petróleo.
- **Tinta Petróleo** (#0f3440): todo o texto sobre o chão, os blocos claros, os painéis e as telas; ícones e sinal de mais dentro dos discos menta; réguas de 1px de cabeçalho de tabela, de soma e de eixo; a barra em foco; o preenchimento das opções pressionadas; o símbolo grande e esmaecido do fechamento. 13,2:1 sobre o branco, 11,9:1 sobre o painel e 11,1:1 sobre o chão.
- **Petróleo de Apoio** (#45656b): texto secundário — introduções de seção, legendas, linhas "Fonte:", cabeçalhos de coluna, datas, percentuais, respostas das perguntas e texto de exemplo dos campos. 6,3:1 sobre o branco, 5,7:1 sobre o painel, 5,4:1 sobre a lavagem de menta e 5,3:1 sobre o chão.

### Secondary
- **Menta** (#a7e5d6): a cor da ação — fundo do botão principal, das etiquetas dos cartões flutuantes e ponto de partida das etiquetas dos cartões de números. No petróleo, é o anel de foco e o sublinhado da seção atual e dos links (10,6:1 sobre o petróleo noturno). A tinta sobre a menta chega a 9,4:1. É também a cor de seleção de texto.
- **Menta Clara** (#c4f0e4): hover do botão principal e da pílula "Cadastrar"; ponto claro do degradê dos discos e do ladrilho do logotipo.
- **Lavagem de Menta** (#ddf3ec): o dado selecionado — a linha escolhida da Figura 1, a categoria escolhida no resumo da Figura 3, a medida principal da Figura 3 e o selo "Dados fictícios".
- **Menta Profunda** (#6fcfb5): ponto escuro do degradê dos discos (ícones, etapa disponível, sinal de mais das perguntas, ladrilho do logotipo) e, translúcida, os brilhos radiais da abertura (55%), do bloco da Demonstração (22% no alto e 16% no canto de baixo) e do /login (32%). A tinta sobre ela fica em 7,1:1.
- **Campos de menta**: o brilho da abertura desce do petróleo noturno por **Petróleo do Brilho** (#10404a), **Teal do Brilho** (#2a7a70), **Menta do Brilho** (#8fd6c3) e **Névoa do Brilho** (#d4ede4) até o chão. O cartão de destaque dos números vai, a 160°, de **Destaque Claro** (#e9f8f2) por **Destaque Médio** (#c2ebdf) até **Destaque Profundo** (#b3e6d8); a tinta sobre o ponto mais escuro fica em 9,6:1. O painel de fechamento desce de **Fechamento Claro** (#ecf9f4) por **Fechamento Médio** (#c6ede2) até **Fechamento Profundo** (#95dcc8); a tinta sobre o ponto mais escuro fica em 8,4:1.
- **Luz do Chão** (rgba(167, 229, 214, 0.55)): a menta a 55% no centro das poças de luz que acendem as bordas do chão em Números, Como funciona e Perguntas; a segunda poça de cada seção usa a mesma menta a 35%. No ponto mais forte da poça, o apoio ainda fica em 4,8:1 e a tinta em 10,1:1.
- **Borda do Bloco** (#f0f7f3): a menta pálida para onde o bloco branco do Problema esfria longe do conteúdo; até 58% do raio o bloco é branco puro.

### Tertiary
- **Teal de Marcação** (#1e6b62): sobre o claro — anel de foco, sublinhado dos links e das referências cruzadas, letras (a), (b) e (c), chamadas de nota, disco de "disponível", anel do painel alcançado por âncora e cursor dos campos. A 9%, preenche as colunas do gráfico do chão. 6,3:1 sobre o branco, 5,7:1 sobre o painel, 5,3:1 sobre o chão e 4,0:1 sobre o ponto mais escuro do fechamento. Nunca sobre o petróleo (2,4:1).

### Neutral
- **Chão Sálvia** (#e3ede8): o fundo do documento (raiz e corpo) e do /register; o brilho da abertura termina nele, as poças de luz e o gráfico do trimestre o texturizam, e os recuos dos blocos e os cantos arredondados do rodapé o deixam aparecer. O branco fica a só 1,2:1 dele, por isso blocos e cartões brancos se separam do chão pela sombra suave, não pelo tom.
- **Branco** (#ffffff): o bloco do Problema; os cartões de números, do procedimento, da Figura 2 e das perguntas; a lista do previsto e os blocos do formulário do /login e do /register; as telas (Figura 1, Tabela 1, Figura 3); os campos, a pílula "Cadastrar", o botão secundário e a aba pressionada; separa as fatias da rosca.
- **Painel** (#eef4f1): o painel que segura a Tabela 1 dentro do bloco do Problema e as telas claras dos cartões da Figura 2; também as medidas da Figura 3, o detalhe do gráfico, a contagem de lançamentos, o fundo do marcador de etapa e o hover de linhas, opções e do botão "Mostrar".
- **Linha** (#cddbd6): contorno de 1px do botão secundário, da pílula de link, do seletor segmentado, dos botões de período e dos marcadores de etapa; contorno das perguntas no hover e quando abertas; réguas entre linhas; ligação entre as etapas. É contorno, não fronteira de controle (1,4:1 sobre o branco).
- **Borda de Campo** (#698388): contorno dos campos em repouso, 4,0:1 contra o campo branco.
- **Tijolo de Erro** (#a3341f): borda e mensagem dos campos inválidos, texto do alerta de formulário e seu anel de foco; 6,8:1 sobre o branco. Nunca sobre o petróleo (2,2:1): ali o erro de saída do cabeçalho usa o corrido noturno.
- **Faixa de Erro** (#fbeae6): fundo do alerta de formulário, a faixa rosada acima dos campos que traz falhas do formulário inteiro (credenciais recusadas, e-mail já cadastrado, servidor fora do ar); o texto em tijolo sobre ela fica em 5,9:1. Fica a 1,2:1 do branco, por isso a faixa se distingue também pelo peso 600, pela mensagem e pelo `role="alert"`, não só pelo tom.
- **Texto Noturno** (#eef5f2), **Título Noturno** (#f6faf8), **Corrido Noturno** (#d4e4de), **Apoio Noturno** (#a9c6c0) e **Linha Noturna** (rgba(238, 245, 242, 0.16)): texto de interface, títulos, resumo e introdução, texto de apoio e réguas sobre o petróleo (13,6:1, 14,3:1, 11,5:1 e 8,3:1; sob o brilho do bloco da Demonstração, o corrido noturno ainda fica acima de 7:1). Sobre o petróleo erguido, o apoio noturno fica em 6,3:1 e o corrido noturno, usado na nota de quem entrou, em 8,7:1. O nome de quem entrou ("Olá, nome", peso 500) é texto noturno. O texto noturno a 7% desenha a palavra gigante do rodapé; a 14% e 22%, os contornos dos cartões flutuantes, do botão secundário e do botão de menu no petróleo.
- **Folhas de Trás** (#c9dbd4 e #8fb3aa): as duas faturas que aparecem atrás da Figura 1, a mais clara por cima.

### Dados
- **Barra** (#5b8a88): a série única dos gráficos de barras por categoria (Figuras 1 e 3a) e a barra do mês anterior na variação mensal; 3,9:1 sobre o branco.
- **Barra Recolhida** (#b9cdc9): as demais barras quando uma categoria está selecionada na Figura 3.
- **Categorias**, sempre nesta ordem: Alimentação em **Laranja Queimado** (#d4652c), Transporte em **Verde-Água Profundo** (#00907b), Lazer em **Violeta** (#6a58c4), Assinaturas em **Ocre** (#b07e05) e Outros em **Azul Aço** (#3a78b4). A paleta foi validada sobre o branco: ΔE ≥ 10,1 entre vizinhas sob daltonismo simulado e ΔE ≥ 22,9 em visão normal; o contraste mínimo é 3,6:1. Na tela clara da Figura 2b, sobre o painel, o mínimo cai para 3,2:1.
- **Rampa mensal**, ordinal e de um só matiz, do claro ao escuro: junho (#8ab7b0), julho (#3f7f79) e agosto na própria tinta (#0f3440). A ponta clara fica em 2,0:1 sobre a tela clara da Figura 2a, por isso toda coluna leva mês e valor escritos.

### Named Rules
**A Regra da Menta que Age.** A menta tem três trabalhos: agir (botão principal, pílula "Cadastrar" no hover, etiquetas dos cartões flutuantes), marcar o dado selecionado (lavagem de menta) e acender os campos de luz (brilho da abertura, poças do chão, brilhos do bloco da Demonstração, cartão de destaque dos números, painel de fechamento, discos e ladrilho do logotipo). Não é cor de texto nem destaque de título.

**A Regra do Degradê de Menta.** Degradê só existe como luz de menta: o brilho da abertura, as poças nas bordas do chão, os brilhos radiais do bloco da Demonstração e do /login, a borda do bloco branco do Problema (que esfria para menta pálida longe do conteúdo), o cartão de destaque dos números, o painel de fechamento, as etiquetas dos cartões de números, os discos e o ladrilho do logotipo. Nunca em texto, em telas, em cartões brancos ou em botões.

**A Regra da Luz Medida.** O chão recebe luz, não cor: duas poças de menta por seção (55% e 35% no centro), presas às bordas e alternando de lado — Números e Perguntas acendem a esquerda no alto e a direita embaixo, Como funciona espelha. Nenhum campo novo de cor se abre no chão; em tela larga o centro das poças fica fora do contêiner, e mesmo onde a luz alcança o texto, o apoio fica acima de 4,5:1.

**A Regra do Petróleo em Três Momentos.** O petróleo noturno aparece três vezes na página — na abertura, no bloco da Demonstração e no rodapé — e ocupa o /login inteiro; entre esses momentos, o chão é sálvia. No petróleo, o texto é quase branco e a menta substitui o teal, que ali fica em 2,4:1; dentro de uma tela ou de um bloco branco, mesmo sobre o petróleo, o foco volta ao teal.

**A Regra do Bloco Branco no Petróleo.** Um bloco branco dentro de uma região petróleo — o formulário do /login, a Figura 3 no bloco da Demonstração — restaura as cores de superfície clara: texto em tinta, links de texto em tinta com sublinhado teal, foco em teal e a sombra flutuante. Só o botão de envio, em petróleo, volta a levar texto noturno. Os mesmos links, fora do bloco, seguem em texto noturno com sublinhado menta.

**A Regra da Ação por Fundo.** O botão principal escolhe a cor pelo fundo em que está: menta sobre o petróleo, onde ela é a luz da página; petróleo sobre o branco e sobre a menta, onde a menta sumiria. Todo formulário termina num único envio em petróleo, de largura total, nunca em menta.

**A Regra da Ordem Fixa.** Cada categoria mantém cor e posição em todas as legendas, na barra de composição e na rosca, mesmo quando a lista ao lado é reordenada. Barras de categoria usam uma só cor; o matiz da categoria aparece apenas onde a parte do todo é a mensagem (rosca, composição) e como chave quadrada ao lado do nome, sobre o branco ou, na Figura 2, sobre a tela clara.

## Typography

**Display Font:** Inter Tight variável (peso 400–700), com system-ui, sans-serif como alternativa
**Body Font:** Inter Tight, a mesma família, em peso 400
**Label/Mono Font:** Inter Tight em 600 para rótulos; ui-monospace (Cascadia Mono, Consolas) só para as linhas brutas de CSV da Tabela 1

A Inter Tight é servida pelo próprio site em WOFF2 (`frontend/public/fonts/inter-tight-latin-variable.woff2`, licença OFL), pré-carregada no `index.html` e com `font-display: swap`. Archivo e Source Serif 4 foram removidas.

**Character:** Uma grotesca estreita e firme, pesada no topo como no Finmax: títulos grandes em 600 com espaçamento negativo, números enormes e tabulares, e texto corrido limpo na mesma família.

### Hierarchy
- **Display** (600, 36–58px fluido, entrelinha 1,04, -0,035em): o título da abertura (até 13ch), do /login ("Entre na sua conta.") e do /register ("Crie sua conta."), ambos até 10ch. No petróleo, em título noturno.
- **Heading** (600, 28–40px fluido, entrelinha 1,08, -0,03em): títulos de seção, sem numeração, até 18ch quando centrados, e o título do painel de fechamento (até 14ch). No bloco da Demonstração, em título noturno.
- **Numeral grande** (600, 40–56px fluido, entrelinha 1, -0,04em, tabular): os três números dos cartões de números; 36–48px até 860px.
- **Numeral** (600, 22–28px fluido, entrelinha 1,1, -0,03em, tabular): os valores das quatro medidas da Figura 3 (20px nas três secundárias até 640px). Os números dos cartões flutuantes usam 24px (22px até 1360px), e o centro da rosca, 20px.
- **Title** (600, 20–24px fluido, entrelinha 1,15, -0,025em): títulos dos cartões da Figura 2 e dos blocos de formulário ("Entrar" e "Dados da conta").
- **Subtitle** (600, 17–20px fluido, entrelinha 1,25, -0,02em): títulos das linhas de recurso, das etapas, dos blocos da Figura 3 e das perguntas (estas com entrelinha 1,3).
- **Intro** (400, 16–18px fluido, entrelinha 1,55, até 38–40em): o resumo da abertura, do /login e do /register, em corrido noturno no petróleo e em apoio no claro. As introduções de seção usam o mesmo passo, limitado a 17px; no bloco da Demonstração, em corrido noturno.
- **Lead** (400, 17px, entrelinha 1,6): respostas das perguntas e, com entrelinha 1,5, a frase do painel de fechamento.
- **Action** (600, 16px, -0,01em): botões em pílula, etiquetas dos cartões de números e títulos das colunas do rodapé; os links da navegação usam o mesmo tamanho em 500.
- **Body** (400, 16px, entrelinha 1,5): interface, linhas das figuras e células de tabela. Links em 600; a categoria selecionada em 650; o nome de quem entrou em 500; o alerta de formulário em 600.
- **Caption** (400, 14px, entrelinha 1,4): legendas "Figura N" e "Tabela N" (o rótulo em 650 e tinta, o resto em apoio), botões de período (600) e o rótulo dos cartões flutuantes; as pílulas de link ficam em 15px (600).
- **Small** (400, 14px, entrelinha 1,45): linhas "Fonte:", dicas, percentuais, totais das abas, notas das medidas, a nota de quem entrou e o erro de saída do cabeçalho, e linhas de status (500). Em 600, os **rótulos**: cabeçalhos de coluna, termos das medidas, rótulo do período, selo, contagem, opções do seletor segmentado e mensagens de erro.
- **Wordmark** (600, 56–176px fluido, entrelinha 0,9, -0,04em): só a palavra "gerenCIA" gigante e esmaecida que o rodapé corta.
- **Logotipo** (21px, 20px até 720px, -0,03em): "geren" em 650 e "CIA" em 400.

### Named Rules
**A Regra da Família Única.** A Inter Tight escreve tudo: títulos, texto, números, botões e figuras. A única exceção é a monoespaçada das linhas brutas de CSV. A hierarquia se faz com tamanho, peso (400 a 700) e tinta de apoio, nunca com outra família.

**A Regra do Peso 600.** Títulos e números de destaque ficam em 600 com espaçamento negativo, mais apertado quanto maior (de -0,01em nas ações a -0,04em nos numerais grandes e na palavra do rodapé). O 700 fica reservado às somas e totais que fecham uma conta, às chamadas de nota e ao valor da diferença na Figura 2a.

**A Regra dos Algarismos Tabulares.** Todo número que se alinha a outro — valores, percentuais, datas, totais das abas, números de etapa, numerais dos cartões e das medidas — usa algarismos tabulares (`tabular-nums`).

## Layout

O espaço segue a vitrine do Finmax: contêiner de até 1240px (1320px a partir de 1800px de janela) com margem fluida de 16 a 48px e largura mínima de 320px, tudo sobre o chão sálvia. Os blocos não obedecem ao contêiner: correm de ponta a ponta da janela, recuados 8–20px de cada borda, e devolvem o conteúdo ao contêiner centrado lá dentro. O cabeçalho fixo mede 68px (60px até 960px) e as âncoras reservam 96px.

A abertura é centrada, com 40–72px acima e 56–96px abaixo: título, resumo e ações num bloco de até 780px e, a 36–56px dele, a Figura 1 num palco de até 640px (580px até 1360px). Os cartões flutuantes saem do palco para os lados — o da esquerda mais baixo, o da direita mais alto — e somem até 1180px.

As seções são faixas sobre o chão, com 36–60px acima e abaixo (48–72px na primeira depois da abertura) e sem régua entre elas. Números, Como funciona e Perguntas ficam soltas no chão, com cabeçalho centrado (título até 18ch, introdução até 38em) e poças de luz nas bordas; Números tem ainda o gráfico do trimestre na base, na largura toda, atrás dos cartões. Problema se ergue num bloco branco de ponta a ponta, de cantos de 24–36px, com 24–56px de respiro acima e abaixo e sombra suave; dentro, o contêiner divide 7/5: a Tabela 1 no painel claro à esquerda e o argumento à direita. A Demonstração se ergue num bloco petróleo de ponta a ponta, de cantos de 24–36px (32–64px de respiro acima, 20–56px embaixo), com o cabeçalho dividido em duas colunas (título à esquerda, introdução à direita) em texto claro e a Figura 3 logo abaixo, direto sobre o petróleo. Os cartões de números ocupam três colunas iguais com 16px entre elas. Em Como funciona, o procedimento é um só cartão branco de três colunas, seguido do bento da Figura 2: duas colunas, com o terceiro cartão na largura toda, dividido 5/7. As perguntas ficam numa coluna central de até 760px. O fechamento é um painel menta de ponta a ponta, com o mesmo recuo dos blocos e o conteúdo centrado. O rodapé sobe com os cantos de cima arredondados (24–36px), tem grade 5/4/3 (marca, links em duas colunas, fatos) e a palavra gigante no pé.

O /login e o /register dividem 5/6 entre o texto e o bloco branco do formulário, com as colunas centradas na vertical no /login e alinhadas ao topo no /register: no /login, o texto (título de até 10ch, resumo e a pílula secundária) à esquerda e o bloco à direita, sobre o petróleo; no /register, sobre o chão, a introdução com a lista do previsto à esquerda e o bloco à direita. Nas duas, a página ocupa pelo menos a altura da janela e o conjunto fica centrado na vertical no espaço abaixo do cabeçalho.

A escala de espaço é 4, 8, 12, 16, 24, 32, 48 e 64px. Blocos têm 20–72px de respiro vertical e, nos lados, a margem do contêiner; painéis e cartões, até 36px (22–32px no bento da Figura 2 e no procedimento); telas, 16–32px. Controles têm pelo menos 40px de altura (44px com ponteiro grosseiro, em telas de toque); hoje ficam abaixo disso as opções do seletor segmentado (36px, numa pílula de 46px), os links do rodapé (36px) e o link da linha de troca de página, que tem só a altura do texto.

Até 1360px, o palco encolhe e os cartões flutuantes passam a 188px. Até 1180px, os cartões flutuantes somem. Até 1080px, Problema, o cabeçalho dividido da Demonstração, o /login e o /register viram uma coluna (o texto antes da tabela e do formulário, limitados a 680px), as medidas da Figura 3 passam a duas colunas e o gráfico fica acima do resumo por categoria; o rodapé passa a duas colunas com a marca em cima. Até 960px, a navegação recolhe para o botão de menu e o bento da Figura 2 vira uma coluna. Até 860px, os cartões de números viram uma coluna com o numeral à direita do rótulo, e o procedimento vira uma coluna ligada por linha vertical. Até 720px, o logotipo diminui, o rodapé vira uma coluna, as linhas da Tabela 1 viram registros empilhados, as folhas de trás da Figura 1 recuam para 6px e as perguntas passam a 60px. Até 640px, a tabela de lançamentos também vira registros, os botões de período dividem a largura e a medida principal e a variação ocupam a linha toda. Até 480px, as abas de mês dividem a largura, cada linha da Figura 1 ocupa duas linhas (nome e valor; barra e percentual) e, nas páginas de acesso, o link "Voltar ao início" some do cabeçalho, porque o logotipo já leva ao início. Até 420px, as ações empilham na largura toda e o numeral dos cartões desce para baixo do rótulo.

### Named Rules
**A Regra do Chão e dos Blocos.** Entre a abertura e o rodapé, tudo pousa no chão sálvia: ou como cartão branco solto, com sombra suave (números, procedimento, Figura 2, perguntas), ou dentro de um bloco arredondado que alterna branco (Problema), petróleo (Demonstração) e menta (fechamento). Figura, tabela e formulário são sempre telas ou cartões brancos — dentro de um painel claro, de um bloco ou direto no chão —; só os cartões da Figura 2 invertem a ordem e seguram telas claras. Não há painel dentro de painel, nem a página branca chapada.

**A Regra do Bloco de Ponta a Ponta.** Os blocos branco, petróleo e menta correm de borda a borda da janela, recuados 8–20px e com cantos arredondados; o conteúdo dentro deles volta ao contêiner centrado. Em tela larga, nenhuma seção é uma coluna estreita boiando num campo liso: ou o bloco ocupa a largura, ou o chão em volta tem luz e dado.

**A Regra do Chão que é Dado.** A única textura do chão vem do produto: as 92 colunas do gasto diário do trimestre fictício (junho a agosto, somando o mesmo total das figuras), em teal a 9%, na base de Números, atrás dos cartões e escondidas dos leitores de tela. Grade de planilha, campo de linhas, pontos, ruído ou qualquer padrão decorativo não entram — a grade foi testada e recusada como assinatura de interface gerada.

**A Regra do Centro.** A abertura, os cabeçalhos das seções soltas, as perguntas e o fechamento são centrados; a divisão em colunas fica para onde texto e prova ou formulário andam lado a lado (Problema, Demonstração, /login e /register).

**A Regra do Cabeçalho Corrente.** A navegação lista as quatro seções sem números, e a seção que cruza o meio da tela ganha sublinhado menta de 2px.

## Elevation & Depth

A profundidade vem do contraste entre o chão e o que se ergue dele. O chão sálvia é plano; o branco quase não se distingue dele pelo tom (1,2:1), então todo bloco ou cartão branco no chão leva a sombra suave. Dentro do bloco do Problema, a tela da Tabela 1 se ergue do painel claro com a sombra de tela; sobre o petróleo — no brilho da abertura, no bloco da Demonstração e no /login — a Figura 1, os cartões flutuantes, a Figura 3 e o bloco do formulário pairam com a sombra flutuante, mais funda. Painéis claros, blocos petróleo e menta, pílulas, abas e campos são planos; dentro das telas, a hierarquia volta a ser de réguas, lavagens e peso. As poças de luz e o gráfico do chão não são elevação: ficam atrás de todo o conteúdo e não recebem sombra.

### Shadow Vocabulary
- **Suave** (`box-shadow: 0 1px 2px rgba(11, 42, 51, 0.05), 0 14px 34px -20px rgba(11, 42, 51, 0.28)`): o branco sobre o chão — bloco do Problema, cartões de números, cartão do procedimento, cartões da Figura 2, perguntas, lista do previsto e formulário do /register.
- **Tela** (`box-shadow: 0 1px 2px rgba(11, 42, 51, 0.06), 0 18px 40px -22px rgba(11, 42, 51, 0.32)`): a tela da Tabela 1 sobre o painel claro.
- **Flutuante** (`box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2), 0 30px 60px -24px rgba(0, 0, 0, 0.55)`): sobre o petróleo — a folha da frente da Figura 1, os dois cartões flutuantes da abertura, a Figura 3 no bloco da Demonstração e o bloco do formulário no /login.
- **Anel de âncora** (`box-shadow: inset 0 0 0 2px`, em teal): o cartão da Figura 2 alcançado por âncora; substitui a sombra suave enquanto dura. É estado, não elevação.
- **Borda dobrada de erro** (`box-shadow: inset 0 0 0 1px`, em tijolo): dobra para 2px a borda do campo inválido. É estado, não elevação.

### Named Rules
**A Regra das Três Sombras.** Cada sombra pertence a um chão: a suave ergue o branco do chão sálvia, a de tela ergue a tela do painel claro, a flutuante ergue do petróleo. Painéis claros, blocos coloridos, pílulas, abas e campos nunca flutuam, e nenhum cartão tem contorno em repouso; dentro da tela, agrupamento é régua e destaque é lavagem, peso ou tinta.

## Shapes

A forma é macia e aninhada, como no Finmax: o bloco de 24–36px segura o painel de 24px, que segura a tela de 16px, que segura o controle de 12px; ações e seletores são pílulas.

- **24–36px (bloco):** bloco branco do Problema, bloco petróleo da Demonstração e painel de fechamento (os três de ponta a ponta), blocos de formulário do /login e do /register e cantos de cima do rodapé.
- **24px:** painel claro da Tabela 1, cartões de números, cartão do procedimento, e cartões da Figura 2.
- **16px:** telas brancas (Tabela 1, Figura 3), folhas da Figura 1 — a da frente com o canto superior esquerdo reto, onde a aba pressionada se funde a ela —, topo das telas claras da Figura 2, cartões das perguntas, cartões flutuantes, medidas da Figura 3 e lista do previsto no /register.
- **12px:** cantos de cima das abas de mês, campos, detalhe do gráfico, alerta de formulário e nota de quem entrou.
- **8px:** sinal de mais das perguntas, topo das colunas e pontas da barra de composição da Figura 2.
- **Pílula:** botões (inclusive o envio de formulário), pílulas "Cadastrar" e "Sair", pílulas de link, seletor segmentado e suas opções, botões de período, selo, contagem, etiquetas dos cartões de números e dos flutuantes e o link de pular para o conteúdo.
- **Círculo:** discos de ícone (40px), marcadores de etapa (44px), botão de menu (44px), discos brancos das etiquetas (30px) e marcas de disponibilidade (10px).
- **Pequenos cantos:** chaves de categoria são quadrados de 10px com cantos de 3px (12px com 4px na legenda da Figura 2); chamadas de nota têm cantos de 6px; as barras têm ponta livre de 4–6px e base reta no eixo; o ladrilho do logotipo tem 38px com cantos de 11px.

Os glifos são desenhados. Há um só conjunto de ícones — calendário, recibo, etiquetas, linhas e colunas —, em grade de 24px, traço de 1,75 e pontas redondas, sempre em tinta dentro de um disco menta. Além dele, só o sinal de mais feito de duas barras de 2px, as duas barras do botão de menu e o símbolo de três barras ascendentes: no ladrilho do logotipo e, grande, preenchido e esmaecido, nas laterais do painel de fechamento. Não há setas nem ícones de pacote.

### Named Rules
**A Regra do Aninhamento.** O canto de dentro é sempre menor que o de fora: bloco de 24–36px, painel de 24px, tela de 16px, controle de 12px, pílula na ação. Um cartão solto no chão usa o canto do nível em que está.

## Components

### Buttons
Pílulas diretas: sem seta, sem sombra e com um só rótulo.
- **Shape:** pílula (999px) com borda de 1px.
- **Primary:** menta com texto em tinta, 16px em 600 e -0,01em; altura mínima de 48px e 26px de respiro lateral. "Explorar a demonstração" na abertura, onde o fundo é petróleo.
- **Hover / Focus:** hover em menta clara (180ms); a pressão desce 1px; foco em anel de 3px afastado 3px — teal sobre o claro, menta no petróleo.
- **Principal no campo de menta:** no painel de fechamento, o principal vira petróleo noturno com texto noturno; hover em petróleo erguido.
- **Envio de formulário:** a mesma variante em petróleo, em largura total, 48px de altura e 24px acima, ao fim dos campos: "Entrar" e "Criar conta". Enquanto envia, o rótulo vira "Entrando…" ou "Criando conta…", o botão se desativa, o cursor vira progresso e a opacidade cai a 70% (o texto ainda fica em 5,3:1). O foco é o anel teal sobre o branco do bloco.
- **Secondary:** pílula branca com contorno de linha e texto em tinta; o hover escurece o contorno para o apoio. No petróleo, pílula em petróleo erguido com contorno claro a 22%; hover em petróleo de hover com contorno de apoio noturno. "Como funciona" na abertura, "Explorar a demonstração" no /login e "Criar conta" no fechamento.
- **Pílula "Cadastrar" / "Sair":** no cabeçalho, pílula branca de 44px com 24px de respiro e texto em tinta; hover em menta clara. Para quem entrou, a mesma pílula, agora um botão, diz "Sair".
- **Pílula de link:** 40px (44px em toque), 20px de respiro, contorno de linha, 15px em 600 — "Abrir 2a na demonstração".
- **Link de texto:** 600 com sublinhado de 1px afastado 0,3em — teal sobre o claro, menta no petróleo —, que engrossa para 2px no hover; alvo de 40px (44px em toque). As referências cruzadas no texto ("Tabela 1", "Figura 2") usam o mesmo sublinhado, afastado 0,2em. Dentro de um bloco branco sobre o petróleo (o formulário do /login), os links ficam em tinta com sublinhado teal.

### Chips
- **Discos de ícone:** 40px, degradê de menta clara a menta profunda a 150°, ícone desenhado em tinta (22px). Abrem as linhas de recurso do Problema.
- **Etiquetas dos números:** pílula com degradê de menta a transparente, disco branco de 30px com o ícone (18px) e o rótulo no tamanho action. No cartão de destaque, a etiqueta vira branco a 60%.
- **Seletor segmentado** (tipo de gráfico e ordenação): pílula branca com contorno de linha e 4px de respiro; opções de 36px em small 600; hover em painel; a opção pressionada é preenchida de tinta com texto branco — preenchimento, não matiz. Foco em anel afastado 2px.
- **Botões de período:** pílulas separadas de 40px (44px em toque), contorno de linha, 14px em 600; a pressionada em tinta com texto branco; o hover escurece o contorno.
- **Selo e contagem:** pílulas em small 600 — o selo "Dados fictícios" em lavagem de menta e tinta; a contagem de lançamentos em painel e apoio.

### Cards / Containers
- **Bloco branco:** de ponta a ponta (recuo de 8–20px), cantos de 24–36px, 24–56px de respiro acima e abaixo e sombra suave; branco puro no centro, onde está o conteúdo, esfriando em elipse para a borda do bloco nas pontas. Ergue o Problema do chão.
- **Bloco petróleo:** de ponta a ponta (recuo de 8–20px), petróleo noturno com dois brilhos radiais de menta profunda (22% no alto, 16% no canto de baixo à direita), cantos de 24–36px, 32–64px de respiro acima e 20–56px embaixo, escopo `.on-night`. Ergue a Demonstração.
- **Cartão branco:** branco, cantos de 24px (números, procedimento, Figura 2) ou 16px (perguntas, lista do previsto), sombra suave e nenhum contorno em repouso.
- **Cartão de destaque:** o cartão do meio dos números, com o degradê de destaque no lugar do branco e texto em tinta.
- **Painel claro:** painel, cantos de 24px, 12–32px de respiro, sem borda e sem sombra. Segura a tela da Tabela 1.
- **Tela branca:** branco, cantos de 16px, 16–32px de respiro e a sombra do chão em que está (tela no painel, flutuante no petróleo). Dentro dela, o foco volta ao teal.
- **Painel de fechamento:** degradê de fechamento, cantos de 24–36px como os blocos; ver abaixo.
- **Bloco do formulário:** branco, cantos de 24–36px e 22–36px de respiro. No /login, sobre o petróleo, com a sombra flutuante e as cores do claro restauradas (foco teal, links em tinta); no /register, sobre o chão, com a sombra suave.

### Inputs / Fields
- **Style:** fundo branco, borda de campo de 1px, cantos de 12px, 48px de altura e 16px de respiro; rótulo acima em 600, dica à direita em small de apoio, texto de exemplo em apoio.
- **Focus:** borda em tinta e anel teal de 3px afastado 1px; o hover já escurece a borda.
- **Error / Disabled:** borda tijolo dobrada para 2px e mensagem em small 600 tijolo logo abaixo; ao enviar com erro, o foco vai para o primeiro campo inválido. O botão "Mostrar" da senha é um link de texto dentro do campo, com hover em painel, e vira "Ocultar" quando a senha está visível.
- **Alerta de formulário:** falhas do formulário inteiro — credenciais recusadas, e-mail já cadastrado, "Não foi possível falar com o servidor…" — numa faixa acima dos campos: faixa de erro, texto tijolo em 600 no tamanho body, cantos de 12px, 12px 16px de respiro, `role="alert"`. Recebe o foco ao aparecer, com anel de 3px em tijolo; falha de campo, quando há, vai logo abaixo do campo.
- **Troca de página:** abaixo do botão, 16px, uma linha em apoio — "Ainda não tem conta? Criar conta" no /login, "Já tem conta? Entrar" no /register — com o link em tinta e sublinhado teal.

### Navigation
- **Cabeçalho:** fixo, em petróleo noturno, com linha noturna abaixo e 68px de altura. À esquerda, o logotipo: ladrilho menta de 38px com as três barras em tinta e "gerenCIA" em texto noturno. Ao centro, Problema, Como funciona, Demonstração e Perguntas, no tamanho action em 500 e texto noturno, sem números; o hover mostra um sublinhado de 2px em apoio noturno, e a seção atual, sublinhado menta afastado 0,5em. À direita, "Entrar" (link que ganha sublinhado menta no hover) e a pílula branca "Cadastrar". Quem entrou vê no lugar deles "Olá, {primeiro nome}" em texto noturno 500 e a pílula branca "Sair"; se a saída falhar, a mensagem "Não foi possível sair. Tente de novo." aparece ao lado, em small e corrido noturno. Enquanto a sessão é verificada, a área de conta guarda o espaço mas fica invisível, para que nada pisque.
- **Móvel (até 960px):** cabeçalho de 60px; botão circular de 44px em petróleo erguido, com contorno claro e duas barras que se cruzam em ×. O painel ocupa a largura, em petróleo, com linhas de 52px em 17px separadas por linha noturna e as ações de conta no pé. Escape fecha e devolve o foco ao botão; tirar o foco do cabeçalho também fecha.
- **/login e /register:** o mesmo cabeçalho em petróleo, só com o logotipo e dois links de texto — "Criar conta" e "Voltar ao início" no /login, "Entrar" e "Voltar ao início" no /register —, que nunca quebram de linha; até 480px "Voltar ao início" some.

### Abertura
O primeiro momento da página.
- **Fundo:** petróleo noturno até a metade, que desce por petróleo do brilho, teal do brilho, menta do brilho e névoa do brilho até o chão sálvia, com um brilho radial de menta profunda sob a figura.
- **Bloco centrado:** título display em título noturno ("Sua fatura diz mais que o total."), resumo em corrido noturno, principal "Explorar a demonstração" e secundário "Como funciona".
- **Nota de quem entrou:** sob os botões, uma caixa em petróleo erguido com contorno de 1px em linha noturna, cantos de 12px, 10px 20px de respiro, small em corrido noturno e até 40em, com `role="status"`: "Você entrou como {e-mail}. O envio de faturas ainda está em desenvolvimento; a demonstração abaixo usa dados fictícios." Aparece só depois que a sessão é confirmada, com a mesma animação de assentar da abertura.
- **Palco:** a Figura 1 completa entre dois cartões flutuantes em petróleo erguido (204px, cantos de 16px, contorno claro a 14%, sombra flutuante), girados -5° à esquerda e 4° à direita. Cada cartão tem rótulo em caption de apoio noturno, número em 24px 600 título noturno e tabular, e uma etiqueta menta em pílula: "Saídas no trimestre" com o número de lançamentos, e "Agosto em relação a julho" com o percentual a menos. Os dois são calculados dos mesmos dados das figuras.
- **Movimento:** o único momento de carga do site. Título, resumo e ações sobem 16px saindo de um desfoque de 6px em 720ms, com 0, 80 e 160ms de atraso; o palco faz o mesmo em 900ms, a partir de 220ms. Nada começa invisível: o texto só é suavizado. Curva de saída exponencial.

### Pilha de faturas (Figura 1)
O componente-assinatura: três faturas mensais empilhadas, e a da frente cita os seus totais.
- **Estrutura:** três abas (Junho, Julho, Agosto), cada uma com o mês em 600 e o total em small; sob elas, a folha da frente com a legenda "Figura 1", a linha "Total do mês: R$ X. Selecione uma categoria…" com o total em 650, uma linha de 42px por categoria (nome, barra de 12px, valor com chamada numerada, percentual), a nota e a linha "Fonte:". Atrás, as duas folhas de trás aparecem embaixo e à direita, deslocadas 12px cada (6px até 720px).
- **Abas:** 52px de altura, cantos de 12px em cima, em petróleo erguido com apoio noturno; hover em petróleo de hover. A pressionada é branca, com o mês em tinta, o total em apoio e foco teal, e se funde à folha pelo canto reto. Trocar de aba troca o mês da figura e reabre a nota da maior categoria.
- **Seleção:** a linha escolhida ganha lavagem de menta, nome e valor em 650, barra em tinta e chamada preenchida. A nota repete a chamada, lista os três maiores lançamentos (data em apoio, estabelecimento, valor tabular), fecha com "Soma dos N lançamentos" em 700 sobre régua de tinta de 1px e oferece "Ver os outros N na demonstração".
- **Movimento:** só em resposta, nunca na carga. Ao trocar de mês, a folha sobe 6px em 420ms. Ao abrir uma nota, o título aparece subindo 4px em 420ms; a lista se desdobra de cima para baixo por recorte em 640ms, com 60ms de atraso; soma e link entram aos 260ms; a barra escurece em 260ms.
- **Compacta:** a variante sem a coluna de percentual segue no componente, mas nenhuma página a usa desde que o /login passou a ter formulário.

### Chamadas de nota
Numeral em 700 a 0,7em numa caixa de 1px teal com cantos de 6px, sobrescrito ao valor. Contornada quando cita; preenchida em teal com numeral branco quando a sua nota está aberta.

### Cartões de números
Três cartões brancos com sombra suave sob "Uma demonstração que fecha a conta.", pousados sobre o chão de dados: Faturas, Lançamentos e Categorias. Cada um tem a etiqueta menta com disco e ícone, o numeral grande e uma frase em apoio (até 32ch). O do meio, "Lançamentos", é o cartão de destaque: degradê de destaque, etiqueta em branco a 60% e frase em tinta, porque os lançamentos são o que todo total soma. Os três números são contados dos dados fictícios das figuras; nenhum é digitado à mão.

### Chão de dados
O gasto diário do trimestre fictício desenhado como textura do chão: 92 colunas, uma por dia de junho a agosto, cada uma com a soma dos lançamentos daquele dia (as 92 somam o mesmo total do trimestre das figuras). Ficam na base de Números, na largura toda da janela e com 110–240px de altura, em teal a 9%, esmaecendo de cima para baixo por máscara, atrás dos cartões e escondidas dos leitores de tela. Não têm rótulo nem eixo: são chão, não figura, e a leitura dos mesmos números está na Figura 2a e na Figura 3.

### Problema e Tabela 1
Um bloco branco de ponta a ponta, com sombra suave. À esquerda, o painel claro segura a Tabela 1 numa tela branca: legenda acima, cabeçalho em small 600 de apoio sobre régua de tinta de 1px, linhas separadas por linha, última régua de tinta e linha "Fonte:". A linha bruta do arquivo aparece em monoespaçada small de apoio; a categoria leva a chave de cor. Até 720px, cada linha vira um registro empilhado. À direita, o título, a introdução e duas linhas de recurso separadas por linha de 1px, cada uma com disco de ícone, título em subtitle e texto de apoio.

### Procedimento
Três etapas numeradas, porque são uma sequência real, num único cartão branco com sombra suave. Cada uma tem um marcador circular de 44px (painel, contorno de linha, numeral de 17px em 600 tabular), título em subtitle, texto de apoio e a linha de disponibilidade. Uma linha de 2px na cor de linha liga os marcadores, na horizontal e, até 860px, na vertical. O marcador da etapa já disponível é um disco de menta, sem contorno.

### Leituras (Figura 2)
Bento de três cartões brancos com sombra suave sob a legenda "Figura 2": (a) e (b) lado a lado, (c) na largura toda. Cada cartão tem o título em title com a letra em teal, uma frase de apoio, a pílula de link "Abrir 2x na demonstração" e uma tela clara (painel, sem sombra) que sobe da borda inferior do cartão. O cartão alcançado por âncora troca a sombra pelo anel teal de 2px.
- **(a) Saídas mensais:** colunas na rampa mensal com mês e valor escritos; a queda de julho para agosto aparece como um contorno tracejado de tinta, sem preenchimento, sobre a coluna de agosto, com o valor da diferença em 700.
- **(b) Composição:** barra de 30px dividida na ordem fixa das categorias, com 2px entre as partes e pontas de 8px, e legenda com chaves de 12px e percentuais.
- **(c) Lançamentos:** os três maiores de alimentação em agosto, a linha "Demais N lançamentos" em apoio e "Total da categoria" em 700 sobre régua de tinta.

### Demonstração (Figura 3)
Um bloco petróleo de ponta a ponta, com o cabeçalho dividido em título noturno e corrido noturno e, logo abaixo, a Figura 3 numa tela branca com a sombra flutuante.
- **Cabeçalho:** legenda "Figura 3" e o selo "Dados fictícios"; abaixo, o rótulo "Período" e os botões de período (Junho, Julho, Agosto e 3 meses).
- **Medidas:** quatro cartões em painel com cantos de 16px; a principal (Total de saídas) em lavagem de menta. Rótulo em small 600, numeral e nota em small. A variação mensal é desenhada como diferença: duas barras de 8px, o mês anterior na cor de barra e o atual em tinta.
- **Blocos:** (a) "Para onde foi o dinheiro" e (b) "Lançamentos", com título em subtitle, letra em teal e linha entre eles.
- **Gráfico de barras:** horizontal, série única, barras de até 24px com ponta de 4px, valor escrito à direita em tinta (16px, tabular) e eixo de tinta de 1px. Hover e foco antecipam a categoria em tinta; com uma categoria selecionada, as demais recolhem.
- **Rosca:** ordem fixa das categorias, fatias separadas por 2px de branco, raio interno de 60%; o centro mostra o total ou a categoria em foco, e as outras fatias caem para 28% de opacidade.
- **Detalhe:** frase em small de apoio num painel de cantos de 12px.
- **Resumo por categoria:** cabeçalho sobre régua de tinta com o seletor de ordenação; linhas de 44px com nome, valor e percentual; a selecionada ganha lavagem de menta e 650. As chaves de cor só aparecem no modo rosca.
- **Lançamentos:** contagem em pílula; tabela com cabeçalho em small 600 sobre régua de tinta, linhas separadas por linha, valores em 600 tabulares à direita e "Soma dos N lançamentos = total" em 700. Mostra os dez mais recentes e expande para todos. Até 640px, cada linha vira um registro empilhado.

### Marcas de disponibilidade
Linha em small 500 de apoio com uma marca de 10px: disco teal preenchido para "disponível", anel de 1,5px para "em desenvolvimento". Aparecem no procedimento e na lista do previsto no /register.

### Perguntas
Cartões brancos com sombra suave e cantos de 16px, com 12px entre eles, numa coluna de até 760px. Em repouso não há contorno; no hover e quando a pergunta está aberta, surge o contorno de linha de 1px. A pergunta é uma linha de 64px (60px até 720px) em subtitle, com um ladrilho menta de 26px e cantos de 8px que carrega um sinal de mais desenhado em tinta e gira 45° ao abrir. A resposta vem em lead de apoio, até 40em.

### Painel de fechamento
O degradê de fechamento, de cima para baixo, de ponta a ponta com o recuo dos blocos, cantos de 24–36px e 40–72px de respiro, tudo centrado: título em heading, a frase em lead e tinta, o principal em petróleo ("Explorar a demonstração") e o secundário branco ("Criar conta"). Nas laterais, o símbolo de três barras em tamanho grande (120–210px), preenchido em tinta a 7% (5% até 720px), girado -8° e 8° e cortado pela borda.

### Rodapé
Petróleo noturno com os cantos de cima arredondados (24–36px), deixando o chão sálvia aparecer nas pontas; 40–64px acima. Grade 5/4/3: o logotipo com a frase do projeto; os links em duas colunas, "Seções" e "Páginas" (títulos no tamanho action em texto noturno; links de 36px em apoio noturno, que clareiam e ganham sublinhado menta no hover); os fatos "Dados" (fictícios, de junho a agosto de 2026) e "Em desenvolvimento" (importação de faturas); e a linha legal em small sobre linha noturna. No pé, a palavra "gerenCIA" no tamanho wordmark, em texto noturno a 7%, desenhada como conteúdo gerado, cortada pela borda inferior e fora da ordem de leitura.

### /login e /register
- **/login:** o petróleo inteiro, com um brilho radial de menta profunda vindo de baixo, em duas colunas 5/6 centradas na vertical. À esquerda, display em título noturno ("Entre na sua conta."), resumo em corrido noturno e a pílula secundária "Explorar a demonstração". À direita, o bloco branco do formulário com a sombra flutuante: título "Entrar" em title, os campos "E-mail" e "Senha" (com "Mostrar"/"Ocultar"), o alerta de formulário quando houver, o envio "Entrar" em petróleo na largura toda e, abaixo, "Ainda não tem conta? Criar conta". Em uma coluna até 1080px.
- **/register:** chão sálvia. À esquerda, o título "Crie sua conta.", o resumo e a lista do previsto num cartão branco de cantos de 16px com sombra suave e marcas em anel; à direita, o formulário num bloco branco de cantos de 24–36px com sombra suave: "Dados da conta" em title, os campos nome, e-mail, senha (com a dica "8 caracteres ou mais") e confirmação, o alerta de formulário quando houver, o envio "Criar conta" em petróleo na largura toda ("Criando conta…" enquanto envia) e "Já tem conta? Entrar".
- **Comportamento:** quem já entrou é levado de /login e /register para o início; se a API não responder, o site público segue inteiro e os formulários dizem que não foi possível falar com o servidor.

### Named Rules
**A Regra da Prova Verdadeira.** O gerenCIA não tem depoimentos, clientes, preços nem parceiros para mostrar, e as contas já existem mas ainda não guardam faturas (o envio está em desenvolvimento), por isso as seções do Finmax que dependem disso — depoimentos, planos e preços, faixa de logotipos de parceiros, captura de e-mail e maquete de celular — não existem aqui. Todo número exibido, inclusive os dos cartões flutuantes e dos cartões de números, é calculado dos dados fictícios das figuras, e o aviso de dados fictícios fica no selo da Figura 3 e nas linhas "Fonte:".

**A Regra da Referência Real.** Só há número onde há referência ou sequência de verdade: Figura e Tabela, chamadas de nota, letras dos recortes e etapas do procedimento. Títulos de seção e navegação não levam número; botões e links não levam seta.

**A Regra do Único Momento de Carga.** A página tem um só movimento na chegada — a abertura assentando — e, depois dele, só as respostas da Figura 1 ao clique. Nada se anima por rolagem, letra a letra ou em laço; transições de estado ficam em 180ms; com `prefers-reduced-motion`, toda animação e transição é desligada.

## Do's and Don'ts

### Do:
- **Faça** de cada total exibido uma citação: chamada numerada que abre os lançamentos e uma soma visível que fecha no total.
- **Faça** cada número da vitrine (cartões flutuantes, cartões de números, medidas) sair dos mesmos dados fictícios das figuras.
- **Faça** o fundo em chão sálvia (#e3ede8) e erga o conteúdo em cartões brancos de sombra suave ou em blocos arredondados (24–36px) de ponta a ponta, recuados 8–20px, que alternam branco (#ffffff), petróleo (#0b2a33) e menta.
- **Faça** a luz do chão medida: poças de menta só nas bordas, alternando de lado, e a textura tirada dos dados reais do produto.
- **Faça** o aninhamento dentro dos blocos: painel claro (#eef4f1, 24px) segura tela branca (16px), que segura controle (12px) ou pílula.
- **Faça** toda ação em pílula e a cor do principal pelo fundo: menta (#a7e5d6) com texto em tinta sobre o petróleo; petróleo (#0b2a33) sobre o branco e sobre o campo de menta. A secundária é branca e contornada, ou em petróleo erguido sobre o petróleo.
- **Faça** o formulário terminar num único envio em petróleo, de largura total, e a linha de troca ("Já tem conta? Entrar") logo abaixo.
- **Faça** o bloco branco dentro do petróleo restaurar as cores do claro: texto em tinta (#0f3440), links em tinta com sublinhado teal (#1e6b62), foco teal e sombra flutuante.
- **Faça** a falha do formulário inteiro numa faixa de erro (#fbeae6) acima dos campos, com `role="alert"` e o foco nela, e a falha de campo logo abaixo do campo em tijolo (#a3341f); o texto diz o que houve, nunca só a cor.
- **Faça** a área de conta guardar o espaço, invisível, enquanto a sessão é verificada, e o site público seguir inteiro se a API estiver fora do ar.
- **Faça** os degradês só como luz de menta: brilho da abertura, poças do chão, brilhos do bloco da Demonstração e do /login, borda do bloco branco, cartão de destaque, painel de fechamento, etiquetas dos números, discos e ladrilho do logotipo.
- **Faça** a gramática de figura dentro das telas: "Figura N" ou "Tabela N" acima, réguas de 1px (#cddbd6) entre linhas, régua de tinta nos cabeçalhos e somas, e linha "Fonte:" em small de apoio.
- **Faça** o estado aparecer por marca além da cor: preenchido para pressionado, aberto e disponível; contornado para citado e em desenvolvimento; peso para o selecionado; tinta para a barra em foco.
- **Faça** barras por categoria numa só cor (#5b8a88), com a barra em foco em tinta e as demais em #b9cdc9 quando houver seleção; compare meses na rampa de um matiz e desenhe a variação como diferença.
- **Faça** o matiz de categoria aparecer sobre o branco, onde a paleta foi validada; a tela clara da Figura 2 é o limite (mínimo de 3,2:1).
- **Faça** alvos de pelo menos 40px (44px em toque) e foco em anel de 3px — teal sobre o claro, menta no petróleo (escopo `.on-night`), teal de novo na aba pressionada e dentro das telas — e desligue todo movimento com `prefers-reduced-motion`.

### Don't:
- **Não** volte à página branca chapada: o fundo é o chão sálvia, e o branco fica para blocos, cartões e telas.
- **Não** deixe uma coluna estreita boiando num chão liso em tela larga, nem encha o chão de cor: blocos de ponta a ponta e luz medida.
- **Não** use grade de planilha, campo de linhas, pontos, ruído ou outro padrão decorativo no fundo; a textura do chão vem dos dados do produto.
- **Não** invente prova social: nada de depoimentos, planos e preços, logotipos de parceiros, captura de e-mail ou maquete de celular.
- **Não** use texto em degradê nem degradê fora dos campos de menta.
- **Não** anime por rolagem, letra a letra ou em laço, nem esconda texto com opacidade na carga; o único momento de carga é a abertura.
- **Não** traga de volta Archivo, Source Serif 4 ou outra família, nem o mascote.
- **Não** numere títulos de seção nem a navegação, e não ponha setas em botões ou links.
- **Não** use o teal nem o tijolo sobre o petróleo, nem a menta como cor de texto ou destaque de título.
- **Não** ponha o envio de um formulário branco em menta, nem deixe o bloco branco do petróleo herdar texto e links noturnos.
- **Não** deixe a área de conta piscar entre o estado de visitante e o de quem entrou.
- **Não** reordene as cores de categoria nem pinte barras por categoria.
- **Não** contorne cartões em repouso, não dê sombra a painéis claros, blocos coloridos, pílulas, abas ou campos, e não ponha painel dentro de painel.
- **Não** use ícones de pacote; o conjunto desenhado, o sinal de mais, as barras do menu e o símbolo de três barras são os únicos glifos.
