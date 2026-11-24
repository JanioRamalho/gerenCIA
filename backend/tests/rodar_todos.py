"""Executa a suíte automatizada do backend com o Python ativo."""

from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

RAIZ = Path(__file__).resolve().parents[2]


def executar_pytest(alvo):
    with TemporaryDirectory(prefix="gerencia-pytest-") as pasta:
        temporarios = Path(pasta) / "casos"
        comando = [
            sys.executable, "-m", "pytest", "-v", "-p", "no:cacheprovider",
            "--basetemp", str(temporarios), alvo,
        ]
        return subprocess.call(comando, cwd=RAIZ)


if __name__ == "__main__":
    raise SystemExit(executar_pytest("backend/tests"))
