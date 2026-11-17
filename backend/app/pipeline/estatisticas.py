"""Estatística descritiva em centavos, com arredondamento só na saída."""

from collections import Counter
from decimal import Decimal, ROUND_HALF_UP
from math import ceil, sqrt


def moeda(centavos) -> str:
    return format((Decimal(str(centavos)) / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP), ".2f")


def _quantil(valores, fracao):
    pos = Decimal(len(valores) - 1) * fracao
    i = int(pos)
    return Decimal(valores[i]) + (Decimal(valores[min(i + 1, len(valores) - 1)]) - valores[i]) * (pos - i)


def _modas(valores):
    contagem = Counter(valores)
    maior = max(contagem.values(), default=0)
    return sorted(nome for nome, n in contagem.items() if n == maior)


def estatisticas(gastos) -> dict:
    valores = sorted(int(v) for v in gastos["valor_abs"])
    n = len(valores)
    resultado = dict(quantidade=n, media=None, mediana=None, minimo=None, maximo=None, amplitude=None,
                     desvio_padrao=None, q1=None, q3=None, iqr=None, motivo_dispersao="dados_insuficientes",
                     moda_categoria=_modas(gastos["categoria"]), moda_estabelecimento=_modas(gastos["estabelecimento"]), histograma=[])
    if not n:
        return resultado
    media = Decimal(sum(valores)) / n
    resultado.update(media=moeda(media), mediana=moeda(_quantil(valores, Decimal("0.5"))),
                     minimo=moeda(valores[0]), maximo=moeda(valores[-1]), amplitude=moeda(valores[-1] - valores[0]))
    if n >= 4:
        q1, q3 = _quantil(valores, Decimal("0.25")), _quantil(valores, Decimal("0.75"))
        desvio = (sum((Decimal(v) - media) ** 2 for v in valores) / n).sqrt()
        resultado.update(q1=moeda(q1), q3=moeda(q3), iqr=moeda(q3 - q1), desvio_padrao=moeda(desvio), motivo_dispersao=None)
    # Faixas inteiras em centavos; última borda inclusiva, demais [início,fim).
    faixas = min(8, ceil(sqrt(n)))
    largura = max(1, (valores[-1] - valores[0] + faixas - 1) // faixas)
    inicio, fim = valores[0], valores[-1]
    limites = list(range(inicio, fim, largura)) or [inicio]
    for i, minimo in enumerate(limites):
        maximo = limites[i + 1] if i + 1 < len(limites) else fim
        ultimo = i == len(limites) - 1
        quantidade = sum(minimo <= v <= maximo if ultimo else minimo <= v < maximo for v in valores)
        resultado["histograma"].append(dict(inicio=moeda(minimo), fim=moeda(maximo), quantidade=quantidade, fim_inclusivo=ultimo))
    return resultado
