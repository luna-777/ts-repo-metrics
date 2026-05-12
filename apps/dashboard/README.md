# Results dashboard (`apps/dashboard`)

Next.js app for analyzing GitHub repos via `@repo-metrics/engine` (same package as the CLI). No subprocess: the API route imports the engine directly.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Dev server (http://localhost:3000) |
| `npm run build` | Build engine, then `next build` |
| `npm run start` | Production server after build |

From repo root: `npm run dashboard` / `npm run dashboard:build`.

## Code Complexity tab (lexical & cognitive)

The **Code Complexity** tab under Results shows per-function Halstead volume, cyclomatic complexity, cognitive complexity, GRAD-AI `MI_norm` / `MI_raw`, and React component heuristics when `.tsx` is in scope. It includes:

- **How we interpret complexity** — metric framing and glossary-style definitions  
- **Definitions & formulas** — collapsible references with KaTeX and citations  
- **Threshold calibration** — collapsible sourced table (MI / CC / cognitive bands)  
- **Repo-level summary cards** — aggregates with methodology help icons  
- **Traffic-light cell tinting** — `lib/phase2Traffic.ts` applies bands documented in the threshold panel  

See `docs/METRICS_CONCEPTS.md` and `docs/ARCHITECTURE.md` for engine vs dashboard responsibilities.

## Tests

Dashboard logic for threshold bands is covered by root Vitest: `apps/dashboard/__tests__/phase2Traffic.test.ts` (run `npm test` from the repo root).

## Deploy

See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md).

## Repo coach chat

On a results page, **Chat** in the header opens a side panel that streams from `/api/chat`. Requires `OPENAI_API_KEY`. The API sends a text summary plus a **valid JSON subset** of the report (size-capped and reduced in code, never naive string truncation), static **COACH_CONTEXT** (definitions / methodology), and uses a shorter summary cap when JSON is present to save tokens.
