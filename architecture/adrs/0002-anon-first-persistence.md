# ADR-0002: Anon-first persistence

## Status

Accepted — 2026-06-01

## Context

A user must never lose work on reload, and must reach the first real value
without an account. "No-login first" is a core design principle. We also
want optional cross-device sync and read-only sharing for users who do
create an account.

## Decision

Three persistence tiers:

1. **IndexedDB via Dexie** — active on first interaction, no login, survives
   reload, device-local. This is the default and only required tier for MVP.
2. **Supabase (Postgres)** — optional, on account creation. The Dexie
   project is mirrored to Supabase for cross-device sync and a read-only
   share-link (`/share/<projectId>?token=<jwt>`; JWT carries only
   `projectId` + expiry).
3. **Lead-DB** — future, only with explicit GDPR consent.

The Dexie schema mirrors the backend schema so account creation is an
`INSERT` from Dexie to Supabase, and login on a new device is a `SELECT`
into Dexie. Conflict resolution is last-write-wins at project level with a
warning; richer resolution only if a real problem appears.

## Consequences

- Positive: Instant start, offline-capable, zero backend dependency for the
  core flow; sharing is cheap.
- Negative: Schema must be kept symmetric across Dexie and the backend;
  last-write-wins can drop concurrent edits (acceptable for MVP).
- Neutral: Auth and sync code paths are dormant until a user opts in.

## Alternatives considered

- Server-session-first (login required): rejected — violates no-login-first,
  adds backend cost and friction before any value.
- `localStorage`: rejected — too small, string-only, no structured queries;
  reserved for trivial UI prefs only.
