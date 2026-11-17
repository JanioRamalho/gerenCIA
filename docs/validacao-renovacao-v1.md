# Validação da renovação interna

Data: **17/11/2026**. Branch: **Janio**. Base de execução: `0134cbf`.
Marco de implementação validada: **`90db79a`**; escopo sem IA: **`dcace0b`**.
IA excluída por decisão do usuário; [escopo vigente](superpowers/specs/2026-11-17-escopo-sem-ia.md).

## Resultado local

- **295 testes passaram** em 90,97 s na suíte completa, com PostgreSQL temporário.
- Build TypeScript/Vite passou, sem aviso de chunk acima de 500 kB.
- Percurso Playwright real: cadastro, CSV + XLSX, reenvio, qualidade, comparação,
  paginação, correção, limite, avisos/leitura, logout/login e exclusões.
- Cinco abas preenchidas em **320/768/1280/1920 px**: sem rolagem lateral,
  erros JavaScript ou violações axe nas regras WCAG A/AA verificadas.
- Cinco abas vazias também verificadas nas quatro larguras.
- Zoom **nativo de 200%** do Chrome confirmado nas configurações, perfil temporário,
  sem emulação de viewport ou CSS zoom: DPR 2, janela 1440, leitura útil 712 px,
  `visualViewport.scale=1`. Cinco abas com CSV importado, legíveis e sem violações axe.
- Demonstração pública: modos de gráfico, filtros, URL/reload e teclado passaram em
  320/390/768/1440 px. Página pública, login e cadastro passaram no axe.
- Regressão de acesso passou: sessão, cookie HttpOnly, erros de formulário,
  proteção de rotas, menu móvel e estados de API indisponível.

Isso documenta a verificação executada; axe não substitui toda avaliação humana
de acessibilidade. Nenhum teste usou o banco do `.env`.

## Comandos e evidências

```powershell
.\.venv\Scripts\python.exe -m pytest -o pythonpath=backend -p no:cacheprovider --basetemp=.impeccable/pytest-final-v1-02 backend/tests -q --tb=short --maxfail=3
npm --prefix frontend run build
.\.venv\Scripts\python.exe scripts/frontend/check_panel_flow.py
```

Os scripts de navegador usam `GERENCIA_TEST_URL=http://127.0.0.1:5199`, Vite
ligado à API temporária 8011 e o marcador do runner descartável. Foram executados
também `check_dashboard.py`, `check_front_experience_a11y.py` e `check_auth_flow.py`.
Instruções reproduzíveis em [scripts/frontend](../scripts/frontend/README.md).

Capturas/JSON ficam em `.impeccable/review/`, ignorados pelo Git:
`panel-real-flow.json`, `real-{aba}-{largura}.png`, `interface-empty-real.json`,
`native-zoom200-real.json` e `real-native200-*-viewport.png`/`*-detail.png`.
As capturas usam somente contas e dados fictícios.

## Aceites

| ID | Estado e evidência |
| --- | --- |
| A01 | Validado local: gasto líquido exato, entradas/pagamentos separados; testes puros/API e totais dos exemplos no navegador |
| A02 | Validado local: API com 325 itens, filtros antes da paginação; busca/paginação reais na interface |
| A03 | Validado local: meses explícitos, calendário ausente e bases não positivas em testes; comparação livre na interface |
| A04 | Validado local: estatística, vazio/amostras pequenas e histogramas; detalhes presentes e axe com detalhes abertos |
| A05 | Validado local: hash, ID bancário, conflito, suspeita e promoção; concorrência com PostgreSQL |
| A06 | Validado local: CSV/XLSX Nubank/modelo, sinais, origem e conservação das linhas; histórico misto serializa sem NaN |
| A07 | Validado local: quatro dimensões, rejeições/download e cancelamento atômico em testes; detalhe real na interface |
| A08 | Validado local: links levam período, UUID/elegibilidade e categoria nula explícitos; investigação e filtros reais |
| A09 | Validado local: correção persistida e regra futura em testes/API; edição pela interface |
| A10 | Validado local: faixas 79/80/100/101, salto, concorrência, recriação e mês anterior nos testes |
| A11 | Validado local: memória/leitura/contador, histórico após queda do gasto e interação no sino |
| A12/A13 | Adiados por instrução do usuário: sem IA nesta etapa |
| A14 | Validado local: exclusões de arquivo/conta, cascatas e invalidação da sessão em PostgreSQL e navegador |
| A15 | Validado local: dois usuários e recursos alheios protegidos nos testes de API |
| A16 | Validado local: cinco abas, quatro larguras, zoom 200%, foco/menu/Escape, movimento reduzido e axe |
| A17 | Validado local: instalação/evolução, metadados/UUIDs/códigos, guardas de migração e comparação ORM/esquema; baseline intacta |
| A18 | Parcial: execução local e configuração Vercel preparadas; versão refatorada ainda não publicada nem migrada no banco de uso |
| A19 | Documentação e oito exemplos atualizados; ensaio automatizado local concluído; ensaio humano na hospedagem pendente |
| R01–R04 | Validados localmente: identidade, comparação, serviços e cinco recentes com investigação completa |
| R05 | Validado: transporte/formatadores comuns, remoções sem consumidores e regressões pública/acesso |
| R06 | Validado localmente: 295 testes, build, Alembic e percurso real; publicação tem aceite próprio |
| R07 | Histórico local e documentação preservam o ponto de recuperação; exemplos têm resultados reconciliáveis |

## Simplificação realizada

Removidos `AnalysisTestPage.tsx`, seu CSS, `PanelDashboard.tsx` substituído e o
endpoint exclusivo de prévia: cerca de **500 linhas de caminhos obsoletos**,
incluindo os contratos antigos do cliente. `/teste-analise` encaminha a Arquivos,
que exige sessão. O transporte HTTP e moeda/percentual agora são compartilhados.
Os estilos internos e o código do Painel são carregados sob demanda.

O arquivo `pipeline/analise.py` passou de 356 para 241 linhas,
com estatística e duplicidade extraídas para módulos puros reutilizados. Foram
acrescentadas funcionalidades e testes; o projeto total cresceu. A redução foi de
duplicação e caminhos mortos, sem minificar fontes ou esconder novas responsabilidades.

`analisar_arquivo` continua por ter testes legítimos de leitura; `/api/dashboard`
permanece como fachada de compatibilidade. `get_with_quality` passou a atender o
detalhe real de Arquivos. Migração `0004` preserva metadados antes de retirar
Bronze/mapeamentos e recusa conteúdo sem conversão segura. A revisão inicial e
os scripts SQL históricos não foram alterados.

## Hospedagem informada

Projeto: `janioramalho12-2999/gerencia`. Site existente:
[gerencia-liart.vercel.app](https://gerencia-liart.vercel.app/).
GETs de página inicial, `/api/health` e `/api/health/database` responderam 200;
isso confirma a versão atualmente hospedada e sua conexão, sem identificar o SHA.

Nenhum push, deploy ou migração no banco de uso foi executado. Não havia CLI
Vercel, vínculo `.vercel/project.json` ou autenticação CLI local disponíveis.
A tentativa de ler o painel pelo controle do navegador não conseguiu navegar.
Falta vincular/autenticar o projeto, preparar backup/restauração e janela de
migração e só então publicar a revisão compatível. Consulte o [guia Vercel](vercel.md).
Não declarar A18 concluído a partir dos testes locais ou dos GETs da versão anterior.
