# IA do gerenCIA: perfil de gastos e detecção de anomalias

O gerenCIA implementa um modelo próprio de aprendizado de máquina, escrito do
zero em Python (sem `scikit-learn` nem chamada a API externa), para aprender o
**perfil de gastos** de cada usuário e emitir alertas quando uma fatura
extrapola muito o padrão daquela pessoa.

Cada conta tem o seu próprio perfil: quem costuma gastar entre R\$ 5 mil e
R\$ 7 mil recebe alerta ao chegar a R\$ 10 mil; já quem costuma gastar entre
R\$ 20 mil e R\$ 24 mil tem esse patamar tratado como normal e só recebe alerta
quando foge do próprio histórico.

## 1. Como os dados entram no modelo

1. O usuário importa extratos ou faturas (CSV ou XLSX) pela interface ou API.
2. O pipeline (`backend/app/pipeline/previa.py` e `analise.py`) limpa os
   registros com pandas, padroniza datas e valores e separa compras/tarifas de
   pagamentos de fatura, estornos e entradas.
3. A função `totais_por_mes` (`backend/app/ai/perfil.py`) agrega o gasto total
   de cada mês `AAAA-MM`.
4. O usuário pode informar, de forma opcional, sua **renda mensal** na página
   **Conta** (`/app/account`), gravada em `users.monthly_income` e usada como
   contexto (percentual comprometido da renda).

## 2. O modelo: regressão linear escrita do zero

A classe `RegressaoLinear` (`backend/app/ai/regressao.py`) modela o gasto
mensal como uma reta ao longo do tempo:

$$\hat{y} = a + b \cdot x$$

- $x$: posição do mês na linha do tempo ($0$ para o primeiro mês, $1$ para o
  seguinte e assim por diante);
- $a$ (intercepto): patamar inicial de gasto da pessoa;
- $b$ (inclinação): tendência média de alta ou queda por mês;
- $s$ (desvio residual): tamanho típico da variação normal em torno da reta.

Os parâmetros são calculados diretamente pela solução analítica dos **mínimos
quadrados ordinários (OLS)**, usando o NumPy apenas para armazenar vetores e
efetuar somas:

$$b = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sum (x_i - \bar{x})^2}, \qquad a = \bar{y} - b\bar{x}$$

$$s = \sqrt{\frac{\sum (y_i - \hat{y}_i)^2}{n - 2}}, \qquad R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$$

O divisor $n - 2$ desconta os dois parâmetros ($a$ e $b$) estimados com a
mesma amostra. Os testes unitários comprovam que $a$ e $b$ coincidem com
`numpy.polyfit(x, y, 1)`.

## 3. Detecção de anomalias com validação *leave-one-out*

Se um mês muito alto (como R\$ 10.880) entrasse no treino usado para avaliar a
si mesmo, ele puxaria a reta para cima e inflaria o desvio residual $s$,
podendo **mascarar a própria anomalia**.

Para evitar isso, cada mês $i$ é avaliado separadamente pelo método *deixa um
de fora* (*leave-one-out*):

1. Remove-se o mês $i$ da amostra e treina-se a regressão linear nos outros
   $n - 1$ meses (por isso o mínimo são **4 meses**, garantindo 3 pontos no
   treino e $n_{\text{treino}} - 2 \ge 1$).
2. Calcula-se o gasto esperado $\hat{y}_i = a + b \cdot x_i$.
3. Calcula-se o erro padrão da previsão para aquela posição $x_i$:

$$\text{SE}(x_i) = s \cdot \sqrt{1 + \frac{1}{n_{\text{treino}}} + \frac{(x_i - \bar{x})^2}{S_{xx}}}$$

   Aplica-se um piso de 5% da média dos gastos para que um histórico quase
   constante não dispare alertas por diferenças de poucos reais.
4. Mede-se quantos desvios o gasto real ficou acima do previsto:

$$z_i = \frac{y_i - \hat{y}_i}{\text{incerteza}_i}$$

5. Se $z_i > 2{,}0$ (`LIMIAR_DESVIOS`), o mês é marcado como **anomalia**.
   Apenas desvios **positivos** geram alerta: gastar menos que o habitual (ou
   estar no início do mês corrente) não é tratado como extrapolação.

Por fim, o retrato exibido no painel (`perfil`) é reajustado apenas com os
meses normais, para que o mês anômalo não distorça o gasto típico nem a
previsão do próximo mês.

## 4. Por que o modelo não é 100% assertivo

Explicar os limites da técnica faz parte do estudo acadêmico:

1. **Amostra pequena (até 12 meses):** com poucos pontos, um único mês mais
   alto ou mais baixo altera bastante a inclinação $b$ e o erro residual $s$.
   Por isso a resposta informa explicitamente a `confiabilidade` (`baixa` para
   4–5 meses, `moderada` para 6–11 e `razoavel` a partir de 12).
2. **Ausência de sazonalidade:** uma reta não distingue meses naturalmente mais
   caros (dezembro, 13º salário, férias, matrícula escolar, IPVA/IPTU) de uma
   perda real de controle financeiro, podendo gerar falsos positivos nessas
   épocas.
3. **Relação nem sempre linear:** mudanças bruscas e permanentes no padrão de
   vida (novo aluguel, financiamento, mudança de emprego) formam degraus que
   uma regressão linear simples aproxima apenas pela média.
4. **Múltiplas anomalias na mesma janela:** se houver dois ou mais meses
   extremos nos mesmos 12 meses, um deles continua presente no conjunto de
   treino ao avaliar o outro, podendo reduzir o valor de $z$ e mascarar o
   alerta. O sistema sinaliza isso em `avisos`.
5. **Escolha do limiar ($2{,}0$ desvios):** é um compromisso entre sensibilidade
   e precisão. Um limiar menor aumenta falsos alertas; um maior pode deixar
   escapar meses problemáticos.

Evoluções futuras naturais incluem acumular 24+ meses para modelar
sazonalidade, usar regressão robusta (como Huber) para resistir a múltiplos
outliers e combinar a série mensal com alertas por categoria.

## 5. Estudo fictício pronto para a banca

A pasta `scripts/exemplos/ia/` traz um gerador reproduzível e duas faturas no
formato Nubank para um perfil fictício com **renda mensal de R\$ 5.000,00**:

- [historico_11_meses.csv](../scripts/exemplos/ia/historico_11_meses.csv):
  11 meses (dez/2025 a out/2026) com gastos entre R\$ 5.310,00 e R\$ 6.930,00;
- [fatura_nov_2026_anomala.csv](../scripts/exemplos/ia/fatura_nov_2026_anomala.csv):
  12º mês (nov/2026) com gastos de **R\$ 10.880,00** (incluindo passagem aérea,
  notebook e hotel).

Com os 11 meses normais, nenhum alerta é disparado. Ao incluir nov/2026:

- **Gasto típico aprendido:** R\$ 6.061,82 (121% da renda de R\$ 5.000,00);
- **Tendência mensal:** +R\$ 41,45/mês · **variação normal ($s$):** R\$ 513,15 · **$R^2$:** 0,074;
- **Esperado para nov/2026:** R\$ 6.310,55 (limite de alerta: R\$ 7.532,75);
- **Real em nov/2026:** R\$ 10.880,00 (**7,5 desvios acima**, +72% sobre o
  esperado) → **ANOMALIA DETECTADA**.

### Demonstrar no terminal (sem banco e sem API)

```powershell
.\.venv\Scripts\python.exe scripts/demonstrar_ia.py
.\.venv\Scripts\python.exe scripts/demonstrar_ia.py --sem-anomalia
```

### Demonstrar no sistema web

1. Cadastre uma conta em `/register` e acesse **Conta** (`/app/account`) para
   informar a renda mensal de `5.000,00`.
2. Em **Arquivos** (`/app/files`), importe `historico_11_meses.csv` e veja no
   **Painel** (`/app`) o cartão **Perfil de gastos (IA)** com status
   *Dentro do padrão*.
3. Importe `fatura_nov_2026_anomala.csv` e volte ao **Painel**: o cartão muda
   para *1 anomalia detectada*, destaca nov/2026 com a mensagem explicativa e
   permite abrir a tabela mês a mês e as limitações do modelo.

## 6. Onde está no código

| Camada | Arquivo | Papel |
| --- | --- | --- |
| Modelo matemático | `backend/app/ai/regressao.py` | Regressão linear (OLS), $s$, $R^2$ e erro padrão da previsão |
| Perfil e anomalias | `backend/app/ai/perfil.py` | Agregação mensal, *leave-one-out*, limiar de desvios e avisos |
| Serviço | `backend/app/services/ai.py` | Busca transações e renda do usuário autenticado |
| API | `backend/app/api/ai.py` e `api/auth.py` | `GET /api/ai/spending-profile` e `PATCH /api/auth/me` |
| Banco | `scripts/sql/monthly_income.sql` e `005_monthly_income.sql` | Coluna opcional `users.monthly_income` com `CHECK > 0` |
| Interface | `frontend/src/components/panel/SpendingProfileCard.tsx` e `AccountSection.tsx` | Cartão de alerta no painel e formulário de renda na conta |
| Dados e demo | `scripts/exemplos/ia/` e `scripts/demonstrar_ia.py` | Faturas fictícias de 12 meses e demonstração no terminal |
| Testes | `backend/tests/test_ai_perfil.py` e `test_ai_api.py` | Testes unitários do modelo e de integração HTTP + PostgreSQL |
