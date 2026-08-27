"""Enforce deterministic module boundaries using Python's AST."""

from __future__ import annotations

import ast
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGETS = (ROOT / "scoring.py", ROOT / "matching.py")
FORBIDDEN_ROOTS = {
    "boto3",
    "botocore",
    "httpx",
    "llm_client",
    "requests",
    "urllib",
    "urllib3",
}


def imported_roots(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    roots: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            roots.update(alias.name.split(".", 1)[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            roots.add(node.module.split(".", 1)[0])
    return roots


def main() -> int:
    violations: list[str] = []
    for path in TARGETS:
        if not path.is_file():
            violations.append(f"{path.name}: required module is missing")
            continue
        forbidden = sorted(imported_roots(path) & FORBIDDEN_ROOTS)
        if forbidden:
            violations.append(f"{path.name}: forbidden imports: {', '.join(forbidden)}")

    if violations:
        for violation in violations:
            print(f"ERROR: {violation}", file=sys.stderr)
        return 1

    print("Architecture check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
