#!/usr/bin/env python3
"""scoring.py / matching.py 금지 import 검사."""

from __future__ import annotations

import ast
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

REPO_ROOT = Path(__file__).resolve().parents[2]
AI_BACKEND_DIR = REPO_ROOT / "backend" / "src" / "ai_backend"

DEFAULT_TARGETS: tuple[Path, ...] = (
    AI_BACKEND_DIR / "scoring.py",
    AI_BACKEND_DIR / "matching.py",
)

FORBIDDEN_PREFIXES: tuple[tuple[str, str], ...] = (
    ("boto3", "AWS SDK"),
    ("botocore", "AWS SDK"),
    ("aioboto3", "AWS SDK"),
    ("bedrock", "legacy LLM provider import"),
    ("langchain", "LLM 호출"),
    ("openai", "LLM 호출"),
    ("anthropic", "LLM 호출"),
    ("google.genai", "LLM 호출"),
    ("google.generativeai", "LLM 호출"),
    ("requests", "네트워크 호출"),
    ("httpx", "네트워크 호출"),
    ("aiohttp", "네트워크 호출"),
    ("urllib.request", "네트워크 호출"),
    ("urllib3", "네트워크 호출"),
    ("http.client", "네트워크 호출"),
    ("socket", "네트워크 호출"),
    ("ssl", "네트워크 호출"),
    ("websockets", "네트워크 호출"),
    ("websocket", "네트워크 호출"),
    ("llm_client", "LLM 호출 로직은 ai_backend/llm_client.py 에만 위치해야 함"),
    (
        "ai_backend.llm_client",
        "LLM 호출 로직은 ai_backend/llm_client.py 에만 위치해야 함",
    ),
    ("fallback", "fallback 은 상위 모듈에서만 사용"),
    ("ai_backend.fallback", "fallback 은 상위 모듈에서만 사용"),
)


@dataclass(frozen=True)
class Violation:
    file: Path
    lineno: int
    detail: str

    def render(self) -> str:
        return f"{self.file}:{self.lineno}: {self.detail}"


def _match_forbidden(module: str) -> str | None:
    for prefix, reason in FORBIDDEN_PREFIXES:
        if module == prefix or module.startswith(f"{prefix}."):
            return f"forbidden import '{module}' ({reason})"
    return None


def _imported_modules(tree: ast.AST) -> list[tuple[int, str]]:
    found: list[tuple[int, str]] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                found.append((node.lineno, alias.name))
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                found.append((node.lineno, node.module))
            for alias in node.names:
                if node.module:
                    found.append((node.lineno, f"{node.module}.{alias.name}"))
                found.append((node.lineno, alias.name))
    return found


def scan_file(path: Path) -> list[Violation]:
    if not path.is_file():
        return [Violation(path, 0, "파일을 찾을 수 없음")]
    try:
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    except SyntaxError as exc:  # pragma: no cover
        return [Violation(path, exc.lineno or 0, f"파싱 실패: {exc.msg}")]

    violations: list[Violation] = []
    for lineno, module in _imported_modules(tree):
        detail = _match_forbidden(module)
        if detail:
            violations.append(Violation(path, lineno, detail))
    return violations


def scan_paths(paths: Iterable[Path]) -> list[Violation]:
    violations: list[Violation] = []
    for path in paths:
        violations.extend(scan_file(Path(path)))
    return violations


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    targets = [Path(arg) for arg in argv] if argv else list(DEFAULT_TARGETS)

    violations = scan_paths(targets)
    checked = ", ".join(str(target) for target in targets)
    if violations:
        print("[check-forbidden-imports] 금지 import 발견:")
        for violation in violations:
            print(f"  - {violation.render()}")
        print("  Gemini 호출은 ai_backend/llm_client.py 에만 두어야 합니다.")
        return 1

    print(f"[check-forbidden-imports] OK - 금지 import 없음 ({checked})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
