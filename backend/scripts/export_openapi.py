from __future__ import annotations

import json
from pathlib import Path

from main_backend.app import app


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    output_path = repo_root / "docs" / "api" / "main-backend-openapi.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(app.openapi(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
