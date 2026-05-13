# Security policy

## Supported versions

We aim to keep the latest stable releases of this monorepo on supported dependency chains. Run `npm audit` at the repository root and in `apps/dashboard` periodically.

## Reporting a vulnerability

**Please do not open public GitHub issues for undisclosed security problems.**

- Prefer [GitHub Security Advisories](https://github.com/scottyUX/ts-repo-metrics/security/advisories) for this repository (Private vulnerability reporting), **or**
- Contact the maintainers through whatever secure channel they advertise on the repo profile.

Include steps to reproduce, affected components (CLI `@repo-metrics/engine`, dashboard `apps/dashboard`, Supabase integration), and severity assessment where possible.

## Scope

**In scope**

- This repository’s code (engine, dashboard API routes, auth/token handling).
- Misconfiguration guidance documented in [`apps/dashboard/.env.example`](apps/dashboard/.env.example).

**Out of scope (examples)**

- Third-party services (GitHub, Supabase, OpenAI, Vercel/Railway) except where our integration clearly mishandles secrets or validates input.
- Denial-of-service via cloning enormous repositories without configurable limits (track hardening separately).

## Secrets

Never commit real `.env` files. Server-only variables (`SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_OAUTH_ENCRYPTION_KEY`, `OPENAI_API_KEY`) must remain on the server. See deployment docs under `apps/dashboard/`.

## Supply chain

Root `npm audit fix` was used to address dev-tooling vulnerabilities (Vitest/Vite transitive deps). **`npm audit` may still report moderate findings** tied to Next.js’s bundled `postcss` until upstream bumps land; avoid `npm audit fix --force` for those entries without validating `apps/dashboard` (it may propose incompatible Next versions).

Dependabot is configured under `.github/dependabot.yml`. Merge upgrades routinely after running `npm test`.
