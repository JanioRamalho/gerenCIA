# Renovação visual do frontend

Direção aprovada em 17/11/2026: **Leitura financeira guiada**, com composição
limpa, petróleo e menta, Inter Tight e seções abertas separadas por linhas.
A aprovação final inclui comparação em duas barras, recorrências visíveis
com os nomes reais identificados nos arquivos e cinco lançamentos no final
do Painel, com acesso à lista completa em Transações.

## Implementação

- Painel: resumo aberto, cinco maiores categorias com expansão, comparação
  livre entre meses e estatísticas adicionais recolhidas.
- Assinaturas e recorrências: nomes fornecidos pela API, assinaturas primeiro,
  classificação e evidências preservadas. Netflix e Spotify aparecem quando
  identificadas nos arquivos, sem inserir serviços fictícios na conta.
- Os dois gráficos comparam valores observados dos meses. A comparação das
  recorrências consulta o resumo existente do mês de referência; indisponibilidade
  aparece como ausência de dados com tentativa de recuperação, sem inventar zero.
- Transações: valor e estabelecimento juntos no celular, filtros com rótulos
  legíveis e nome do arquivo de origem no editor.
- Arquivos: envio e histórico antes dos exemplos, histórico adaptado ao celular
  e semântica correta nas dimensões da qualidade.
- Limites: categorias configuradas ordenadas por urgência; categorias sem limite
  em lista compacta. Conta mantém os dados e a confirmação de exclusão.
- Início, login e cadastro: composição coerente com o produto, formulário primeiro
  no celular e textos de disponibilidade atualizados.

Nenhuma alteração no código do backend, nas regras financeiras, no esquema
do banco ou nas dependências do produto. A branch existente é `Janio`; a `main`
permanece preservada.

## Evidência local

A auditoria anterior às alterações registrou 28 estados no desktop e celular.
Um revisor visual e um revisor técnico trabalharam independentemente. Depois da
implementação, um terceiro revisor inspecionou as novas capturas e identificou
uma cor ausente nas barras da referência e ajustes de concisão/clareza. Essas
correções foram agrupadas antes da confirmação final.

O percurso automatizado está em `scripts/frontend/check_panel_flow.py`.
Ele exige o marcador do banco descartável antes de criar ou excluir contas de
ensaio. Não opera sobre o banco de uso nem sobre a conta demo do usuário.

O percurso verifica importação CSV/XLSX, reenvio idempotente, qualidade, totais
conciliados de setembro/outubro/novembro (R$ 1.820 / R$ 1.735 / R$ 1.990),
nomes de assinaturas, gráficos, expansão de categorias, cinco recentes,
paginação, busca, correção de categoria, limites, avisos, logout/login,
remoção de arquivo, exclusão da própria conta e comparação de meses não
consecutivos. Capturas e relatório locais ficam em `.impeccable/review/`.

As verificações de acessibilidade com axe são automatizadas e limitadas às
regras executadas; não representam certificação WCAG ou teste com leitor de
tela. O build local não mede os limites ou o desempenho da hospedagem.

Resultado final: build TypeScript/Vite concluído; 25 capturas/estados verificados,
incluindo as cinco abas em 320/390/1440 px, início/acesso em desktop e celular e
qualidade de arquivo. Zero erros JavaScript, transbordamentos globais ou
violações nas regras axe executadas. Os dois gráficos tiveram suas duas barras
verificadas como visíveis. A falha simulada na referência das recorrências e sua
recuperação também passaram. O detector de design apresentou somente o aviso
que reconhece “Inter” dentro de “Inter Tight”; a fonte da marca foi preservada.

## Publicação

Publicação autorizada pelo usuário no projeto existente `janioramalho12-2999/gerencia`.
O registro do commit, envio à branch e resultado hospedado deve ser acrescentado
após sua verificação; compilação local ou push, isoladamente, não comprovam
publicação em produção. Não executar migrações como parte desta mudança visual.
