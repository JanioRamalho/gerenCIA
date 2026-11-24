"""Atalho para as demonstrações em backend/tests."""

from pathlib import Path
from runpy import run_path


if __name__ == "__main__":
    demonstrador = Path(__file__).resolve().parents[1] / "backend" / "tests" / "demonstrar_testes.py"
    run_path(str(demonstrador), run_name="__main__")
