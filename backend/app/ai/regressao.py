"""Regressão linear simples, escrita do zero pelo método dos mínimos quadrados.

O modelo descreve o gasto de cada mês como uma reta:

    gasto = a + b · x

- x é a posição do mês na linha do tempo (0 para o primeiro mês, 1 para o
  seguinte e assim por diante);
- a (intercepto) é o nível de gasto no primeiro mês;
- b (inclinação) é quanto o gasto sobe ou desce, em média, a cada mês.

Os mínimos quadrados escolhem a e b que deixam a menor soma possível dos
erros ao quadrado. As fórmulas fechadas são:

    b = Σ (x − x̄)(y − ȳ) / Σ (x − x̄)²
    a = ȳ − b · x̄

Não usamos scikit-learn nem outra biblioteca de aprendizado de máquina: o
NumPy só guarda os números em vetores e faz as somas. Os testes conferem que
o resultado é igual ao do numpy.polyfit, que resolve o mesmo problema.

Por que este modelo NÃO é 100% confiável e onde pode falhar:
1. Amostra pequena (~12 meses): com poucos pontos, um único mês fora da curva
   altera muito a inclinação (b) e o desvio residual (s). Não há volume de
   dados suficiente para garantir estabilidade estatística alta.
2. Sensibilidade a outliers: como os mínimos quadrados elevam os erros ao
   quadrado, um valor muito extremo puxa a reta na direção dele. (Em perfil.py,
   mitigamos isso avaliando cada mês com leave-one-out e retreinando o perfil
   final apenas com os meses normais.)
3. Premissa de linearidade: gastos pessoais nem sempre seguem uma reta. Uma
   mudança permanente de patamar (ex.: novo aluguel, financiamento ou troca de
   emprego) gera um degrau que a reta aproxima mal.
4. Ausência de sazonalidade: esta reta só usa o índice do mês (x) e não sabe
   distinguir épocas naturalmente mais caras (dezembro, 13º, férias, IPVA/IPTU)
   de uma extrapolação real — o que pode gerar falsos positivos nesses meses.
5. Extrapolação nas pontas: quanto mais distante x está do centro dos dados
   (x̄), menos confiável é a previsão da reta.

Como o código mede a própria qualidade e mitiga parte dessas limitações:
- desvio_residual (s) usa divisor (n − 2) para não subestimar o erro em
  amostras pequenas;
- r2 expõe com transparência quanto da variação do gasto é explicada pela reta;
- erro_da_previsao(x) alarga automaticamente a margem de incerteza quando n é
  pequeno (termo 1/n) e quando x está nas extremidades ((x − x̄)² / Sxx).
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Sequence

import numpy as np

MINIMO_DE_PONTOS = 3  # com 2 pontos a reta passa por eles e não sobra erro para medir a variação


@dataclass(frozen=True)
class RegressaoLinear:
    """Uma reta já treinada e as medidas necessárias para usar e avaliar o modelo."""

    intercepto: float        # a
    inclinacao: float        # b
    pontos: int              # n, quantos meses entraram no treino
    media_x: float           # x̄
    soma_quadrados_x: float  # Sxx = Σ (x − x̄)²
    desvio_residual: float   # s, o tamanho típico do erro da reta, em reais
    r2: float                # parte da variação do gasto explicada pela reta (0 a 1)

    @classmethod
    def treinar(cls, x: Sequence[float], y: Sequence[float]) -> RegressaoLinear:
        """Calcula a reta que melhor passa pelos pontos (x, y)."""
        x_arr = np.asarray(x, dtype=float)
        y_arr = np.asarray(y, dtype=float)
        if x_arr.shape != y_arr.shape or x_arr.ndim != 1:
            raise ValueError("x e y precisam ser listas do mesmo tamanho.")
        n = len(x_arr)
        if n < MINIMO_DE_PONTOS:
            raise ValueError(f"São necessários pelo menos {MINIMO_DE_PONTOS} pontos para treinar.")

        media_x = float(x_arr.mean())
        media_y = float(y_arr.mean())
        desvios_x = x_arr - media_x
        desvios_y = y_arr - media_y

        sxx = float(np.sum(desvios_x ** 2))
        if sxx == 0:
            raise ValueError("Os valores de x precisam variar; todos os meses estão na mesma posição.")
        sxy = float(np.sum(desvios_x * desvios_y))

        inclinacao = sxy / sxx
        intercepto = media_y - inclinacao * media_x

        # Resíduo é o erro da reta em cada ponto: o real menos o previsto.
        residuos = y_arr - (intercepto + inclinacao * x_arr)
        soma_erros = float(np.sum(residuos ** 2))     # SSE (erros ao quadrado: por isso outliers pesam muito)
        soma_total = float(np.sum(desvios_y ** 2))    # SST (variação total em torno da média)
        # Divisor (n − 2) pelos 2 parâmetros estimados (a e b). Em amostras
        # pequenas como 12 meses, dividir por n subestimaria o erro real.
        desvio_residual = math.sqrt(soma_erros / (n - 2))
        # R² mede quanto a reta explica a variação dos gastos (0 a 1). Se a
        # pessoa gasta de forma estável em torno de uma média (reta quase
        # horizontal), R² fica baixo mesmo com a reta descrevendo bem o perfil;
        # por isso a detecção de anomalia se apoia em `desvio_residual` e em
        # `erro_da_previsao`, não só no R².
        r2 = 1.0 - soma_erros / soma_total if soma_total > 0 else 1.0

        return cls(
            intercepto=intercepto,
            inclinacao=inclinacao,
            pontos=n,
            media_x=media_x,
            soma_quadrados_x=sxx,
            desvio_residual=desvio_residual,
            r2=r2,
        )

    def prever(self, x: float) -> float:
        """Gasto esperado para a posição x: a + b · x."""
        return self.intercepto + self.inclinacao * float(x)

    def erro_da_previsao(self, x: float) -> float:
        """Incerteza, em reais, ao prever um mês novo na posição x.

        Fórmula do intervalo de previsão da regressão simples:

            s · √(1 + 1/n + (x − x̄)² / Sxx)

        Esta fórmula é a principal proteção matemática contra excesso de
        confiança em amostras pequenas:
        - "1" representa a variação natural de um mês para outro;
        - "1/n" penaliza o histórico curto (com 11 meses pesa bem mais do que
          com 60 meses, alargando o limite de alerta automaticamente);
        - "(x − x̄)² / Sxx" aumenta a incerteza nas pontas (primeiro mês,
          último mês e previsão do mês futuro), onde a reta falha com mais
          facilidade.
        """
        distancia = (float(x) - self.media_x) ** 2 / self.soma_quadrados_x
        return self.desvio_residual * math.sqrt(1 + 1 / self.pontos + distancia)
