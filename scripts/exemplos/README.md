# Dados fictícios de importação

Os downloads da tela Arquivos ficam em `frontend/public/exemplos/`. Os dois CSV
antigos deste diretório continuam como fixtures históricas dos testes da prévia;
não são a fonte da demonstração atual.

## Para começar

Importe **uma versão** de cada exemplo de três meses: CSV ou XLSX. As versões
representam os mesmos movimentos e mantêm identificadores estáveis. Não importe
ambas para aumentar o histórico: a segunda versão é uma cópia confirmada.

| Download em `/exemplos/` | Como usar |
| --- | --- |
| `modelo-vazio.csv` / `.xlsx` | Preencha as linhas e escolha Extrato ou Fatura no envio. Negativo significa saída e positivo significa entrada em ambos os tipos. Data, descrição e valor são obrigatórios; categoria e ID são opcionais. |
| `exemplo-extrato-3-meses.csv` / `.xlsx` | Extrato Nubank fictício, reconhecido automaticamente; receitas, despesas e saldos observados. |
| `exemplo-fatura-3-meses.csv` / `.xlsx` | Fatura Nubank fictícia, reconhecida automaticamente; positivo é compra, negativo é estorno ou pagamento. |
| `exemplo-comparacao-com-lacuna.csv` / `.xlsx` | Planilha-modelo: escolha Extrato. Use uma conta de demonstração separada para preservar setembro sem registros. |

Os dados de três meses abrangem setembro, outubro e novembro de 2026, até
15/11. O intervalo observado não comprova cobertura bancária integral. O extrato
e a fatura contêm despesas distintas para poderem ser usados juntos sem repetir
uma compra entre formatos. Não há nome, e-mail ou conta bancária real.

## Números para conferir

| Gasto líquido | Extrato | Fatura | Juntos |
| --- | ---: | ---: | ---: |
| Setembro | R$ 1.385,00 | R$ 435,00 | R$ 1.820,00 |
| Outubro | R$ 1.275,00 | R$ 460,00 | R$ 1.735,00 |
| Novembro, observado até 15/11 | R$ 1.425,00 | R$ 565,00 | R$ 1.990,00 |
| Histórico | R$ 4.085,00 | R$ 1.460,00 | R$ 5.545,00 |

Receitas: R$ 9.300,00. Pagamentos de fatura: R$ 1.750,00, separados dos gastos.
Estorno de Saúde em outubro: R$ 10,00, já abatido do gasto líquido. Netflix tem
R$ 80,00 observados, duas cobranças legítimas com IDs diferentes em novembro,
base mensal de R$ 40,00 e extrapolação anual de R$ 480,00; mudar o filtro não muda
essa base histórica. As parcelas do notebook ficam fora da recorrência.

No exemplo separado com lacuna, agosto soma R$ 150,00 e outubro R$ 110,00:
diferença de −R$ 40,00, ou aproximadamente −26,67%. Outubro continua sem setembro
como base quando a análise se chama “mês anterior”.

## Regeração opcional

Os arquivos públicos já estão prontos e não exigem ferramenta extra na execução
do aplicativo. `gerar_exemplos.mjs` é uma ferramenta de autoria que usa
`@oai/artifact-tool` de um ambiente de ferramentas externo ao produto. Com essa
dependência disponível na resolução de módulos do script, execute:

```powershell
node scripts/exemplos/gerar_exemplos.mjs
```

As prévias e inspeções ficam em `.impeccable/review/exemplos/`, ignorado pelo Git.
Os testes `backend/tests/test_exemplos_publicos.py` conferem os downloads reais,
as duas versões de arquivo e seus totais.
