# RQ3 React & TSX metrics — implementation plan (completed)

This document records the **Phase 1** plan for research question **RQ3 (quality outcomes)** as applied to **React / TSX** static signals, what was implemented, and where it lives in the repo.

## Goals

- Emit a structured **`reactMetrics`** block on `RepoReport` when `.tsx` files are analyzed.
- Support **repo mining** and **dashboard** consumption with stable JSON and UI.
- Align **high-level** terminology with prior work on React smells and cohesion (**Ferreira & Valente, 2023**; tool: [reactsniffer](https://github.com/fabiosferreira/reactsniffer)) without reimplementing that tool.

## Scope (Phase 1)

| Area | Delivered |
|------|-----------|
| Engine | Tree-sitter heuristics per `.tsx` file: components (functions with JSX), hook counts, JSX nesting depth, Ferreira-style flag (hooks + SLOC thresholds), Tampere-style depth flag, same-file prop pass-through MVP, hook-safety heuristics |
| Report | `ReactMetricsReport` with `components[]` and `summary` on `RepoReport` |
| Dashboard | Tab **RQ3 — React / TSX**, KPI grid, per-component table, methodology panel (citations + datapoint definitions) |
| Ops | Git clone cache under `os.tmpdir()` for `/api/analyze` (avoids stale `apps/dashboard/.cache`); optional Supabase; dev memory + `sessionStorage` fallback |
| Docs | This file, `docs/SCHEMA.md`, `docs/ARCHITECTURE.md`, `README.md` |

## Engine layout

| Path | Role |
|------|------|
| `packages/engine/src/utils/constants.ts` | Thresholds: JSX depth (5), Ferreira hook/SLOC |
| `packages/engine/src/types/report.ts` | `React*` interfaces and `reactMetrics?` on `RepoReport` |
| `packages/engine/src/extract/react/astReactUtils.ts` | JSX detection, max JSX depth |
| `packages/engine/src/extract/react/hookSafety.ts` | Conditional hooks, `useEffect`/`useCallback` deps heuristics |
| `packages/engine/src/extract/react/propDrilling.ts` | Param name collection, pass-through edges |
| `packages/engine/src/extract/react/extractReactMetrics.ts` | Per-file extract + merge |
| `packages/engine/src/pipeline/analyzeRepo.ts` | Runs React extractors for each `.tsx` file |

## Dashboard layout

| Path | Role |
|------|------|
| `apps/dashboard/app/api/analyze/route.ts` | `cacheDir = join(os.tmpdir(), "repo-metrics-git-cache")` |
| `apps/dashboard/components/results/rq/ReactMetricsSection.tsx` | KPIs + table |
| `apps/dashboard/components/results/rq/ReactMetricsBenchmarkInfo.tsx` | References (Ferreira DOI, PDF, ReactSniffer) + datapoint glossary |
| `apps/dashboard/lib/reportTypes.ts` | Mirrors engine types for UI |

## References (research)

- Ferreira, F., & Valente, M. T. (2023). *Detecting Code Smells in React-based Web Apps.* **Information and Software Technology**, 155, 107111. [DOI 10.1016/j.infsof.2022.107111](https://doi.org/10.1016/j.infsof.2022.107111)
- Tool repository: [github.com/fabiosferreira/reactsniffer](https://github.com/fabiosferreira/reactsniffer)

## Verification

- `cd packages/engine && npm run build && npm test`
- `cd apps/dashboard && npx tsc --noEmit` (and `npm run build` for production checks)

## Future work (not in Phase 1)

- Deeper alignment with ReactSniffer’s full smell catalog
- Cross-file prop drilling
- Stricter ESLint-equivalent Rules-of-Hooks coverage
