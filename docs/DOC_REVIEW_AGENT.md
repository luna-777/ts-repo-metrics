# Documentation review agent

The dashboard classifies and reviews student planning documents (`.md` / `.pdf`) in a GitHub repository using a two-agent OpenAI pipeline. Results are stored on the same `analyses` row as repo metrics for research joins.

## Enable locally

1. Apply migration `supabase/migrations/20260522010000_analyses_doc_review.sql` (or the snippet in `supabase/run_in_dashboard_sql_editor.sql`)
2. Set in `apps/dashboard/.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   DOC_REVIEW_ENABLED=true
   ```
3. Configure Supabase auth (same as analyze) — sign-in required
4. Run an analysis → **Results → Documentation** → **Review documentation**

In-app contributor docs: `/docs/documentation-review`

## User flow

1. Student or instructor runs repo analysis (persists `result_id`, optional `course_id` / `team_name`)
2. Open results page → **Documentation** tab
3. Click **Review documentation** (or view cached result from `doc_review_json`)
4. UI shows classifications, checklist summaries, coach paragraphs, consistency warnings

Course submissions show a non-grading research notice when `report._submission.course_id` is set.

## Pipeline architecture

| Step | Model | Role |
|------|-------|------|
| Discovery | — | GitHub Trees API; filter `.md`/`.pdf`; docs pool vs repo-wide |
| Extraction | — | UTF-8 markdown; PDF via `pdf-parse` (Node only) |
| Classifier | `gpt-4o-mini` | Tool loop; max 10 iterations; 30s timeout |
| Reviewer | `gpt-4o` | Per-document tool loop; sequential with 300ms gap |
| Consistency | — | Deterministic warnings (no LLM) |

**Document types:** `release_plan`, `sprint_plan`, `sprint_report`, `test_plan`, `definition_of_done`, `code_standards`, `unknown`

**Duplicate handling:** When two files share the same type + sprint number, both are reviewed; the second is flagged `duplicate: true`. Reviews are keyed by file path.

## Discovery folders

Paths under these prefixes are treated as the **docs pool** (case-insensitive):

- `docs/`, `doc/`, `documentation/`
- `documents/`, `project-docs/`, `team-docs/`
- `reports/`, `deliverables/`, `artifacts/`

Other `.md`/`.pdf` paths are **repo-wide** candidates (DoD and code standards only).

**Caps:** 40 files max, 2 MB per file, 15 MB total, depth 8. Skips `node_modules`, `.git`, `.next`, `dist`, `coverage`.

## API

### `POST /api/doc-review`

Requires authenticated session, GitHub OAuth token, `DOC_REVIEW_ENABLED=true`, and `OPENAI_API_KEY`.

```json
{
  "resultId": "owner-repo-abc123",
  "url": "https://github.com/org/repo",
  "report": { }
}
```

- `resultId` (required) — links to `analyses.result_id`
- `url` / `report` optional — fall back to stored analysis row

Returns `DocReviewResult` JSON and upserts `analyses.doc_review_json`.

**Errors:** `401` unsigned-in, `403` no GitHub token, `503` disabled/missing OpenAI/schema, `504` global timeout (90s)

### `GET /api/results/[id]/doc-review`

Returns stored `doc_review_json` or `404` if not run yet.

## Response shape (summary)

```json
{
  "docReviewVersion": "1.0.0",
  "resultId": "...",
  "folder_found": true,
  "classifications": [],
  "reviews": {},
  "consistency": { "warnings": [] },
  "warnings": [],
  "timings": { "discoveryMs": 0, "classifyMs": 0, "reviewMs": 0, "totalMs": 0 }
}
```

## Consistency checks (deterministic)

- Duplicate `docType` + sprint number across paths
- Sprint numbers outside 1–4
- Multiple `release_plan` files
- Missing `release_plan` or `definition_of_done` (informational)
- **Language coverage:** repo languages from `report.github.languages` vs classified `code_standards` docs

**Not yet implemented:** story-ID traceability across plans; test-plan claims vs engine verification.

## Database

```sql
alter table public.analyses
  add column if not exists doc_review_json jsonb;
```

Nullable — existing rows unaffected. Join research data via `result_id` with `course_id`, `team_name`, `github_login`.

## Ops notes

- **Runtime:** Node.js only (`export const runtime = "nodejs"`) — not Edge-compatible
- **Formats:** `.md` and `.pdf` only
- **Timeout:** 90s global; typical ~50s; partial per-doc results on individual timeouts
- **Cost:** ~$0.10 per repository (estimate)
- **Privacy:** Never log raw document text (`doc.text` / `fullText`)

## Testing

Pure helpers and validators are covered in `apps/dashboard/__tests__/docReview/`:

- `validate*.test.ts` — post-LLM normalization
- `constants.test.ts` — docs-folder path matching
- `docKey.test.ts` — duplicate flagging
- `runConsistencyChecks.test.ts` — language coverage
- `classifyDocs.test.ts` — mocked OpenAI (no live API in CI)

Run: `npm test` from repo root.

## Code layout

```
apps/dashboard/lib/docReview/
  discoverDocs.ts    — GitHub tree + folder pools
  extractText.ts     — md/pdf extraction
  classifyDocs.ts    — Agent 1
  reviewDoc.ts         — Agent 2
  rubrics.ts           — frozen checklist keys
  validate.ts          — output validation
  runConsistencyChecks.ts
  runDocReview.ts      — orchestrator
```
