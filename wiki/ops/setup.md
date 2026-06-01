# Local Setup

> Canonical quick-start. The short version is in the root
> [README.md](../../README.md).

## Prerequisites

- Node.js 22+
- pnpm 10+
- Python 3.12 (the locked version — see `.python-version`)
- uv (Python toolchain / venv manager)
- Docker Desktop

> **Windows note:** the `python` on PATH may be a newer version (e.g. the
> Microsoft Store 3.14 shim). `uv` provisions and pins Python 3.12 for the
> API venv regardless, so install uv and let it manage the interpreter.

## Install uv

- Windows (PowerShell): `irm https://astral.sh/uv/install.ps1 | iex`
- macOS/Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`

## One-shot setup

```bash
pnpm install        # workspace JS deps
pnpm run setup      # idempotent: venv via uv, .env.local, codegen
```

`pnpm run setup` is idempotent: installs every workspace, creates the Python
venv via uv, copies `.env.example` → `.env.local` (root and `apps/web/`) if
missing, and runs codegen. (`pnpm setup` without `run` is a reserved pnpm
command — always use `pnpm run setup`.)

## Run

```bash
pnpm run dev:infra   # postgres+postgis, redis, minio (Docker)
pnpm run dev         # web (:3000) + api (:8000)
```

See the [Port Map](../../README.md#port-map) for all ports.

## Troubleshooting

- **Port already in use:** stop the conflicting process or change the port
  in the relevant app config and the Port Map.
- **uv not found:** install it (above) and reopen the shell.
- **pvlib/geopandas wheels fail:** confirm the venv is Python 3.12, not a
  newer interpreter.
