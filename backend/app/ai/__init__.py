"""IA do gerenCIA: modelo próprio de perfil de gastos e detecção de anomalias.

Nada aqui chama um provedor externo nem depende do FastAPI ou do banco. O
modelo é uma regressão linear escrita do zero (regressao.py) e a detecção de
meses fora do padrão fica em perfil.py. A explicação completa do método e das
limitações está em docs/ia-perfil-de-gastos.md.
"""
