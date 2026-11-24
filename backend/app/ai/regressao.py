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
        soma_erros = float(np.sum(residuos ** 2))     # SSE
        soma_total = float(np.sum(desvios_y ** 2))    # SST
        # n − 2 porque a e b foram estimados com os mesmos dados (graus de liberdade).
        desvio_residual = math.sqrt(soma_erros / (n - 2))
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

        O "1" é a variação natural de um mês para outro; "1/n" é a incerteza
        de ter estimado a reta com poucos meses; o último termo cresce quanto
        mais longe x está do centro dos dados, porque a reta fica menos
        confiável nas pontas.
        """
        distancia = (float(x) - self.media_x) ** 2 / self.soma_quadrados_x
        return self.desvio_residual * math.sqrt(1 + 1 / self.pontos + distancia)
