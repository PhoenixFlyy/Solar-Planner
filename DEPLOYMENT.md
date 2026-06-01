# Deployment

> **Phase:** Pre-deployment. The repo runs locally only. This document
> is a stub.

## Targets (planned)

| Surface | Provider | Tier |
|---|---|---|
| Web | Vercel | Hobby (Free) |
| API | Fly.io | Free Tier |
| Database | Supabase | Free (500 MB Postgres + PostGIS) |
| Auth | Supabase | Free |
| Object Storage | Supabase Storage | Free (1 GB) |
| Error Tracking | Sentry | Developer (Free) |

## Environment Variables

To be enumerated when deployment is set up. Until then, only
`.env.local` is in use.

## Update protocol

When changes affect env vars, ports, services, container images, or
authentication, update this document **before** committing.
