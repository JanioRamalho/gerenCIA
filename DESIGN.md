---
name: gerenCIA
description: "Leitura financeira guiada: petróleo e menta, Inter Tight, seções abertas e hierarquia por tarefa financeira."
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
  panel-sidebar:
    backgroundColor: "{colors.night}"
    textColor: "{colors.on-night}"
    width: "264px"
  panel-menu-item:
    textColor: "{colors.on-night}"
    rounded: "{rounded.control}"
    height: "44px"
    padding: "0 12px"
  panel-menu-item-hover:
    backgroundColor: "{colors.night-hover}"
  panel-menu-item-current:
    backgroundColor: "{colors.night-raised}"
    textColor: "{colors.on-night-title}"
  panel-menu-badge:
    textColor: "{colors.on-night-2}"
    rounded: "{rounded.pill}"
    padding: "1px 8px"
  panel-welcome:
    backgroundColor: "{colors.closing-mid}"
    textColor: "{colors.ink}"
    rounded: "{rounded.block}"
    padding: "clamp(24px, 3vw, 40px)"
  panel-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel-padding}"
  panel-step-next:
    backgroundColor: "{colors.mint-wash}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "16px"
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

# Direção vigente: leitura financeira guiada

Aprovada em 17/11/2026 após auditoria e revisão de protótipos. O usuário rejeitou
a primeira proposta por excesso de componentes. A versão aprovada mantém a
identidade petróleo e menta e substitui grades de cartões por leitura aberta,
espaço entre seções e divisórias que representam relações reais.

## Identidade e tipografia

- Inter Tight permanece como família da marca e dos dados. Valores usam
  algarismos tabulares e alinhamento consistente.
- Petróleo `#0b2a33` na navegação e ações principais; menta `#a7e5d6` como
  acento. Fundo interno `#f6f8f6`, tinta `#0f3440` e apoio `#45656b`.
- As categorias mantêm sua apresentação em `panel/categoryPresentation.ts`.
  Cor complementa nomes e valores; não substitui informação textual.
- Texto de apoio relevante de pelo menos 14px. Campos possuem borda perceptível,
  foco visível, rótulo e estados de erro. Controles operacionais têm alvo de 44px.
- Movimento reduzido é respeitado. Não adicionar animações decorativas,
  gradientes, brilho ou sombras em blocos de conteúdo.

## Painel: operar e compreender

1. Cabeçalho compacto com período, envio e avisos.
2. Total do período em composição aberta, com quantidade e média diária como
   informação secundária.
3. Categorias como área dominante, mostrando cinco por padrão e permitindo
   expandir todas. Comparação livre entre dois meses ao lado, em duas barras
   verticais com valores explícitos. No celular, a comparação segue as categorias.
4. Assinaturas e recorrências abertas: gráfico de valores observados e nomes
   reais vindos da API. Assinaturas identificadas aparecem primeiro; outras
   recorrências continuam disponíveis. A classificação permite conferir as
   evidências, sem esconder os nomes ou o gráfico.
5. Análises adicionais e estatísticas recolhidas, preservando medidas,
   evolução, composição, estabelecimentos e origem dos totais.
6. Cinco lançamentos recentes ao final, com “Ver tudo” para Transações.

Os gráficos de meses compartilham `ComparisonBars`; valores negativos mantêm
a posição relativa ao zero. Referência indisponível não vira zero. A comparação
de recorrências consulta os resumos existentes de cada mês, sem previsão de
cobranças futuras. Netflix ou outro serviço só aparece se identificado nos
arquivos; nenhum serviço ilustrativo é inserido na conta.

## Demais tarefas internas

- Arquivos: envio e histórico antes dos exemplos recolhidos. Qualidade mantém
  suas quatro dimensões e explica duplicatas na unicidade.
- Transações: filtros legíveis, editor com arquivo de origem, valor e
  estabelecimento juntos no celular. Desktop mantém tabela.
- Limites: categorias configuradas por urgência, situação expressa em texto
  e cor de estado; categorias sem configuração em lista compacta.
- Conta: fatos e privacidade em seções abertas; exclusão mantém confirmação.
- Navegação lateral no desktop e menu compacto no celular; Escape fecha menus,
  o foco permanece identificável e nenhum dado financeiro depende só de hover.

## Início e acesso

A página pública apresenta o produto em composição clara e demonstração
interativa com dados fictícios. Preserva figuras, soma dos lançamentos,
procedência e compartilhamento de recortes. Login e cadastro mostram o
formulário primeiro no celular. Textos descrevem somente funções disponíveis.

Não há depoimentos, clientes, preços ou parceiros para inventar. Cada total
da demonstração vem do mesmo conjunto fictício. Na área autenticada, cálculos
e classificação vêm da API. IA, treinamento e predição estão fora desta etapa.

## Restrições de manutenção

- Não reintroduzir grades de cartões iguais, ícones em caixas decorativas ou
  muitos indicadores competindo no primeiro recorte.
- Não esconder funções ou excluir análises para obter uma tela simples:
  recolher informação secundária e manter acesso claro.
- Não copiar nomes e valores ilustrativos do protótipo para os dados reais.
- Preservar nomes da marca, biblioteca de ícones desenhados, semântica,
  teclado, estados vazios, erros e confirmações.
- Regras financeiras, autenticação e esquema do banco permanecem no backend.

Validação e escopo: `docs/validacao-visual-2026-11-17.md`.
