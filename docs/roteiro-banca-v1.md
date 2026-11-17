# Roteiro de demonstração

Use uma conta fictícia e os exemplos de Arquivos. Nunca projete dados pessoais.
Antes da apresentação, confira a revisão publicada e o banco segundo o
[guia da Vercel](vercel.md). A validação atual é local, conforme o
[relatório](validacao-renovacao-v1.md).

## Percurso de cinco minutos

1. **Arquivos:** envie `exemplo-extrato-3-meses.csv` como Extrato e
   `exemplo-fatura-3-meses.xlsx` como Fatura. Mostre o histórico e o detalhe das
   quatro dimensões de qualidade. Reenvie o CSV para demonstrar reaproveitamento.
2. **Painel:** selecione novembro/2026 e referência outubro/2026. O gasto líquido
   é **R$ 1.990,00**, contra **R$ 1.735,00**: diferença **R$ 255,00**. Setembro
   tem **R$ 1.820,00**. Receitas e pagamentos ficam separados; estornos reduzem gasto.
3. **Categorias e serviços:** explique cores/ícones, abra os detalhes e mostre
   valores/evidências das recorrências. Netflix tem base observada de R$ 40,00
   em novembro e anualização de R$ 480,00; isso não prevê cobranças futuras.
4. **Transações:** entre pelo link de categoria, mostre o filtro aplicado,
   paginação e a origem de um item. Faça uma correção só depois de apresentar os
   totais originais. A regra opcional vale para arquivos futuros.
5. **Limites e avisos:** defina limite para uma categoria com gasto no mês corrente;
   mostre progresso e sininho, marque como lido. Ao chegar a 80% há aviso; apenas
   acima de 100% há ultrapassagem. Avisos não se repetem por faixa/categoria/mês.
6. **Conta:** mostre privacidade e confirmação de exclusão. Execute a exclusão
   somente na conta fictícia de ensaio, depois de concluir a demonstração.

Novembro é parcial nos exemplos, com lançamentos até 15/11. Os valores representam
os arquivos importados e não comprovam a cobertura de toda a conta. Se o ensaio
ocorrer em outro mês, os limites de novembro ainda podem ser consultados, mas
novos avisos só são gerados no mês corrente; use uma amostra fictícia desse mês
para demonstrar um novo aviso.

## Comparação com lacuna

Em outra conta fictícia, envie somente `exemplo-comparacao-com-lacuna.csv` como
Extrato. Setembro está ausente. Selecione outubro e escolha agosto explicitamente:
**R$ 110,00 contra R$ 150,00**, diferença **−R$ 40,00 (−26,67%)**. Abra a comparação
por categoria. Saúde não tem base positiva em agosto e não recebe percentual
inventado. O link da coluna de agosto abre as transações de agosto.

## Preparação e recuperação

Confira login, deep links, upload e persistência na mesma origem HTTPS. Abra
o painel em notebook e celular, teste menu/teclado e mantenha os arquivos de
exemplo disponíveis. IA não faz parte desta etapa.

Commits na `Janio` permitem recuperar código. Antes de atualizar banco existente,
prepare e confira a restauração do backup: voltar um commit não restaura dados
ou estruturas removidas por migração. Não execute migrações durante a apresentação.
