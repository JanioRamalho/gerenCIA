# Análise de dados no gerenCIA

A etapa atual transforma arquivos financeiros em transações persistidas,
confere sua qualidade e apresenta análises descritivas. Os números vêm do
backend Python; o React apresenta resultados e encaminha a investigação para
as transações de origem. A entrega atual não inclui IA nem um modelo preditivo.

| Eixo | Pergunta | Implementação |
| --- | --- | --- |
| Transformação | Como o arquivo vira transação? | `pipeline/previa.py` e `pipeline/analise.py` |
| Qualidade | Quais linhas puderam ser usadas? | Rejeições, quatro dimensões e reconciliação atômica |
| Estatística e comparação | Onde e como a pessoa gastou? | `pipeline/analytics.py` e `pipeline/estatisticas.py` |

## 1. Importação e transformação

O envio aceita CSV ou XLSX de até **4 MB**. O limite mantém margem para o corpo
da requisição na hospedagem. O arquivo é processado em memória; transações,
rejeições e relatório são gravados juntos. O original não é armazenado pelo
aplicativo.

O CSV aceita UTF-8 e Latin-1, com delimitador identificado pelo cabeçalho.
A leitura mantém textos antes de converter datas e valores; assim, um
identificador como `00012` não perde seus zeros por uma conversão numérica.
A primeira folha do XLSX é lida e seu nome é preservado. Nos dois formatos,
a origem acompanha a transação: upload, linha e folha quando disponível.
No CSV, linhas vazias e descrições entre aspas com quebra de linha não alteram
o número real da origem.

O adaptador reconhece fatura e extrato Nubank pelos cabeçalhos. Na
planilha-modelo, a pessoa escolhe **Extrato** ou **Fatura** no envio.

| Origem | Convenção de sinais |
| --- | --- |
| Planilha-modelo, nos dois tipos de documento | Negativo é saída; positivo é entrada |
| Extrato Nubank | Negativo é saída; positivo é entrada |
| Fatura Nubank | Positivo é compra; negativo é pagamento ou estorno |

Acrescentar receitas à planilha não inverte o sentido de uma despesa existente.
O tipo vem da evidência da origem e da descrição, sem decisão pela maioria
dos sinais. Natureza explicitamente fornecida na coluna opcional deve ser
uma das naturezas aceitas.

Cada valor é convertido para centavos inteiros ou `Decimal`. O banco guarda
`amount` absoluto e `transaction_type` separado:

| Natureza | Contribuição ao gasto líquido |
| --- | --- |
| `purchase` | Soma a compra |
| `fee` | Soma a tarifa |
| `refund` | Subtrai o estorno no mês de seu próprio lançamento |
| `income` | Receita apresentada separadamente |
| `payment` | Pagamento de fatura apresentado separadamente |
| `other` | Natureza sem evidência suficiente; não inventa uma contribuição |

A categorização aplica regra pessoal ao novo envio, categoria válida fornecida
pela origem, palavras-chave e, por fim, Outros. Uma correção manual altera a
transação escolhida. Salvar uma regra pessoal é opcional e não recategoriza
automaticamente o histórico.

Os downloads reais ficam em `frontend/public/exemplos/`. O
[guia dos exemplos](../scripts/exemplos/README.md) explica os tipos de documento,
as versões CSV/XLSX e os valores fictícios para conferir a demonstração.

## 2. Qualidade e duplicidade

Linhas sem descrição, data existente ou valor convertível são rejeitadas com
número de origem, código e motivo. Linhas de saldo/total não viram transações.
Saldos e naturezas opcionais inválidos também produzem rejeição. CSV com
quantidade de colunas inconsistente é recusado, evitando truncamento silencioso.

| Dimensão | Evidência |
| --- | --- |
| Completude | Linhas com os campos obrigatórios preenchidos |
| Validade | Linhas aceitas após validação de conteúdo e formato |
| Unicidade | Duplicatas confirmadas por identificador bancário; suspeitas informadas separadamente |
| Consistência | Reconciliação de linhas e categorias; transições de saldo quando verificáveis |

O percentual de qualidade é `linhas válidas ÷ linhas lidas × 100`. Um arquivo
com 194 linhas válidas em 200 tem 97%. O detalhe de Arquivos preserva as quatro
dimensões e permite baixar as rejeições. Esse relatório descreve o
processamento original; a análise atual reflete correções posteriores.

As reconciliações incluem:

```text
linhas lidas = linhas válidas + linhas rejeitadas
soma dos gastos líquidos por categoria = gasto líquido do conjunto
saldo pós-lançamento anterior + movimento atual = saldo pós-lançamento atual
```

A última conferência exige linhas adjacentes, saldos conhecidos e ordem
observável. O primeiro saldo não é tratado como saldo inicial anterior à
primeira transação. Ordem descendente, lacunas ou informação insuficiente
deixam a medida indisponível, com motivo. Falha comprovada de reconciliação
recusa o envio inteiro.

O reenvio com o mesmo hash retorna o upload já existente. Para arquivos
sobrepostos, a chave de duplicidade é composta por usuário, formato, tipo de
documento e identificador bancário. A cópia contabilizada é a do upload mais
antigo; o desempate usa UUID do upload, linha de origem e UUID da transação.
Mesmo identificador com data, valor ou natureza divergente é conflito e
cancela o novo envio.

Sem identificador, igualdade de data, descrição normalizada e valor é apenas
suspeita. Compras legítimas iguais permanecem nos totais. Ao excluir o upload
da cópia contabilizada, uma cópia remanescente pode ser promovida.

## 3. Contrato financeiro e períodos

**Gasto líquido = compras + tarifas − estornos**, excluindo somente duplicatas
confirmadas. Receita e pagamento não reduzem a despesa. Combinar fatura e
extrato não autoriza calcular um saldo bancário nem associar movimentos entre
formatos por aproximação.

Um estorno pode tornar uma categoria ou o total negativo. O sinal é mantido.
Participação percentual e rosca ficam indisponíveis quando o total não é
positivo ou quando há categorias negativas incompatíveis com a divisão do
todo. A maior categoria exige algum gasto líquido positivo.

As consultas usam o histórico completo do usuário para os cálculos. Lista
paginada e agregados compartilham os filtros, aplicados antes da paginação.
Um item após a posição 300 continua pesquisável e contabilizado. O Painel
mostra até cinco recentes, em ordem estável, e abre a lista em Transações.

O mês é definido pela data da transação. O calendário corrente usa
`America/Sao_Paulo`. Meses com receita, pagamento ou estorno também são
disponíveis. Um mês sem registros é lacuna; ele não comprova gasto zero.
Categoria ausente em mês com registros pode contribuir com zero no conjunto
importado.

A comparação principal usa dois meses distintos escolhidos pela pessoa:

- Diferença em reais = mês analisado − mês de referência.
- Percentual = diferença ÷ referência somente quando a referência é positiva.
- Referência zero ou negativa mantém a diferença absoluta e informa que o
  percentual está indisponível.
- A lista contém a união das categorias presentes nos dois meses.
- A referência inicial é o mês anterior do calendário quando disponível.
  Não se substitui setembro ausente por agosto automaticamente.
- Agosto e outubro podem ser comparados quando escolhidos explicitamente.
- Todos os meses é uma visão agregada, sem comparação mensal direta.

O backend informa o intervalo observado e se o mês está em andamento.
Uma redução em mês parcial não é apresentada como economia comprovada.
Dias sem lançamento podem valer zero nos dados importados; a série mensal
preserva meses sem registros como lacunas.

No mês corrente, a série diária e a média cobrem até o dia atual ou o último
dia observado no arquivo, o que vier depois. Uma data futura já importada
continua visível e não é apresentada como previsão. Categorias são agrupadas
pelo UUID quando disponível; nomes iguais não misturam categorias pessoais e
globais, nem imputam uma transação sem categoria ao limite global de Outros.

## 4. Estatística descritiva e serviços

Estatísticas de valores usam compras e tarifas elegíveis do período e da
categoria: não incluem estornos, receitas, pagamentos ou duplicatas confirmadas.
A média das despesas difere de gasto líquido dividido pela contagem.

| Medida | Regra |
| --- | --- |
| Quantidade | Número de compras e tarifas elegíveis |
| Média e mediana | Apresentadas juntas, quando há observações |
| Modas | Todas as categorias ou estabelecimentos empatados na frequência máxima |
| Mínimo, máximo e amplitude | Valores das despesas do grupo |
| Desvio padrão | Populacional, calculado sobre todas as despesas observadas |
| Quartis e IQR | Interpolação linear; IQR = Q3 − Q1 |
| Histograma | Faixas de centavos; início inclusivo, fim exclusivo, última faixa com fim inclusivo |

Com menos de quatro despesas, desvio, quartis e IQR são indisponíveis.
Sem observações, não se inventam medidas de posição ou dispersão. Cálculos
de valores e interpolação usam centavos e `Decimal`, com arredondamento
monetário na apresentação. Percentuais são frações identificadas no contrato.
Novos DTOs serializam dinheiro como texto decimal de duas casas; a fachada
`/api/dashboard` adapta os campos numéricos legados sem repetir a matemática.

Para `[10, 20, 30, 40]`, média e mediana são R$ 25,00, Q1 é R$ 17,50, Q3 é
R$ 32,50, IQR é R$ 15,00 e desvio é R$ 11,18. Os testes usam conjuntos pequenos
com resultados conferidos manualmente.

Recorrência confirmada exige mesmo estabelecimento e valor em todos os meses
com registros do histórico, com pelo menos dois meses. Parcelas e duplicatas
confirmadas ficam fora dessa detecção. Um serviço reconhecido pelo nome em
um só mês é assinatura identificada. Um mesmo serviço pode ter as duas
classificações; cada transação é contada uma única vez.

O gasto observado no período escolhido é separado da base mensal histórica.
A base de cada serviço é o gasto do mês mais recente com transações elegíveis
desse próprio serviço. A anualização é essa base multiplicada por doze, com
mês-base explícito. Trocar o filtro não anualiza o agregado histórico nem altera
a base. Lacunas e meses de evidência ficam visíveis. Estorno só é associado
a serviço com vínculo explícito, nunca pela semelhança de texto ou valor.
Não há calendário de cobranças futuras.

## 5. Verificação e evolução

Os testes puros cobrem leitura, tipos, centavos, estatísticas, comparação,
serviços e decisão de duplicidade. Testes com PostgreSQL descartável conferem
persistência, filtros, autorização e migrações. Os testes dos downloads
importam os próprios CSV/XLSX servidos pelo frontend.

A revisão `0004_remove_legacy` retira Bronze e mapeamentos do esquema final.
Ela preserva metadados rastreáveis em `quality_checks.details` e recusa bruto
ou mapeamento significativo sem conversão validada. Não reconstrói sinais
históricos perdidos. O procedimento está no [guia do banco](database-setup.md).
