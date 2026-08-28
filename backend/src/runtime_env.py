from __future__ import annotations

import os
from pathlib import Path


def load_runtime_env() -> None:
    root = Path(__file__).resolve().parents[1]
    env_files = [root / ".env", root / ".env.local"]
    preserved_keys = set(os.environ.keys())

    for env_file in env_files:
        if not env_file.exists():
            continue
        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if not key or key in preserved_keys:
                continue
            os.environ[key] = value
