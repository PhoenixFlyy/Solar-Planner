"""Dump the FastAPI OpenAPI schema to a file (used by the TS codegen).

Usage: python scripts/dump_openapi.py <output_path>

Imports the app and serializes app.openapi() — no running server needed, so
the codegen-sync CI check stays fast and serverless.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from solar_api.main import app


def main() -> None:
    if len(sys.argv) != 2:
        print("usage: python scripts/dump_openapi.py <output_path>", file=sys.stderr)
        raise SystemExit(2)
    out = Path(sys.argv[1])
    out.parent.mkdir(parents=True, exist_ok=True)
    schema = app.openapi()
    out.write_text(json.dumps(schema, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
