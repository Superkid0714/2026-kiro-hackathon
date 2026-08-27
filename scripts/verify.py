"""Run all required project quality checks without silently skipping tools."""

from __future__ import annotations

import importlib.util
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_MODULES = ("ruff", "pytest")


def main() -> int:
    missing = [name for name in REQUIRED_MODULES if importlib.util.find_spec(name) is None]
    if missing:
        print(
            "ERROR: Missing verification tools: " + ", ".join(missing),
            file=sys.stderr,
        )
        print("Run: python scripts/bootstrap.py", file=sys.stderr)
        return 1

    commands = (
        [sys.executable, "-m", "ruff", "check", "."],
        [sys.executable, "-m", "pytest"],
    )
    for command in commands:
        result = subprocess.run(command, cwd=ROOT, check=False)
        if result.returncode != 0:
            return result.returncode

    print("Verification passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
