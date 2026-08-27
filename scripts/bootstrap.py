"""Create a reproducible Python 3.12 development environment."""

from __future__ import annotations

import os
import subprocess
import sys
import venv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VENV = ROOT / ".venv"


def venv_python() -> Path:
    if os.name == "nt":
        return VENV / "Scripts" / "python.exe"
    return VENV / "bin" / "python"


def main() -> int:
    if sys.version_info[:2] != (3, 12):
        print("ERROR: Python 3.12 is required.", file=sys.stderr)
        return 1

    if not VENV.exists():
        print("Creating .venv")
        venv.EnvBuilder(with_pip=True).create(VENV)

    python = venv_python()
    commands = [
        [str(python), "-m", "pip", "install", "--upgrade", "pip"],
        [str(python), "-m", "pip", "install", "-e", ".[dev]"],
    ]
    for command in commands:
        subprocess.run(command, cwd=ROOT, check=True)

    print("Bootstrap complete.")
    print(f"Verify with: {python} scripts/verify.py")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as error:
        raise SystemExit(error.returncode) from error
