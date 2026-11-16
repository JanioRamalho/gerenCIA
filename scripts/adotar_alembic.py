r"""Confere o banco existente e, com --stamp, registra a base do Alembic.

Uso na raiz: .\.venv\Scripts\python.exe scripts/adotar_alembic.py [--stamp]
Sem --stamp, só confere a estrutura e não grava a versão.
"""

import argparse
import sys
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.db.config import get_database_url
from app.db.migration_baseline import adopt_baseline, validate_baseline


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stamp", action="store_true", help="Registra a revisão inicial após validar.")
    args = parser.parse_args()
    engine = None
    try:
        engine = create_engine(get_database_url(), hide_parameters=True)
        with engine.begin() as connection:
            if args.stamp:
                adopt_baseline(connection)
            else:
                validate_baseline(connection)
    except (ValueError, RuntimeError) as error:
        sys.exit(str(error))
    except SQLAlchemyError:
        # Não imprima a URL, os parâmetros nem mensagens do servidor que possam conter dados.
        sys.exit("Não foi possível conferir o banco. Verifique DATABASE_URL, conexão e permissões.")
    finally:
        if engine is not None:
            engine.dispose()
    if args.stamp:
        print("Revisão inicial registrada. Os dados existentes foram preservados.")
    else:
        print("Esquema compatível com a revisão inicial. Nenhuma versão foi gravada.")


if __name__ == "__main__":
    main()
