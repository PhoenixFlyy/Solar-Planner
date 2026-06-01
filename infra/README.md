# Local Infrastructure

Docker Compose stack for local development: PostgreSQL 16 + PostGIS 3.4,
Redis 7, and MinIO (S3-compatible). All free, all local (ADR-0006).

## Usage

```bash
pnpm run dev:infra        # start (foreground)
pnpm run dev:infra:down   # stop
docker compose -f infra/docker-compose.yml up -d   # start detached
```

## Services & ports

| Service | Image | Port(s) | Credentials (local only) |
|---|---|---|---|
| Postgres + PostGIS | `postgis/postgis:16-3.4` | `5432` | `solar` / `solar`, db `solar` |
| Redis | `redis:7-alpine` | `6379` | — |
| MinIO API | `minio/minio` | `9000` | `minioadmin` / `minioadmin` |
| MinIO Console | `minio/minio` | `9001` | `minioadmin` / `minioadmin` |

These match the defaults in `.env.example`. **Never** reuse these
credentials outside local development.

## Data persistence

Named Docker volumes (`postgres-data`, `redis-data`, `minio-data`) keep data
across restarts. To wipe everything:

```bash
docker compose -f infra/docker-compose.yml down -v
```

## After first start

Apply database migrations:

```bash
uv run --directory apps/api alembic upgrade head
```

Create the MinIO bucket (`solar-planner`) via the console at
http://localhost:9001 or the `mc` client when object storage is first used.

## Online equivalents

In online preview these are replaced by Supabase (Postgres + PostGIS,
Storage) and a managed Redis if needed. See [DEPLOYMENT.md](../DEPLOYMENT.md).
