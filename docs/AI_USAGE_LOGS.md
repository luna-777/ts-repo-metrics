# AI Usage: analyzing session logs

This guide describes how to use the dashboard **AI Usage** tab to analyze exported agent session logs. For metric definitions, formulas, and a future engine bridge, see [planning/AI_SESSION_LOG_ANALYZER.md](planning/AI_SESSION_LOG_ANALYZER.md).

## What you can upload

The analyzer accepts:

- **JSON Lines (JSONL)** — one JSON object per line (common for Claude Code–style exports).
- **Single JSON object** or **JSON array** — nested assistant/tool structures are walked and normalized into events.

The implementation lives in [`apps/dashboard/lib/aiSessionLogAnalyzer.ts`](../apps/dashboard/lib/aiSessionLogAnalyzer.ts). The reported **`logAnalyzerVersion`** (see `LOG_ANALYZER_VERSION` in that file) should change only when scoring or parsing rules change.

## Supported formats and limits

- Parsing is **deterministic**: missing primary fields (for example no token `usage` blocks) yield **`null`** metrics where documented in the planning doc, not guessed values.
- Use **reasonably sized** exports (roughly single-session or course-scale files that still fit in browser memory). Very large files may slow the tab or hit browser limits; split exports if needed.
- **CSV-shaped traces** produced from normalized events use the header  
  `event_type,tool_name,session_id,working_dir,timestamp` — compatible with the analyzer’s CSV path.

## Privacy

When you use **file upload** on the AI Usage tab, the browser reads the file with `FileReader` and runs [`analyzeSessionLogFile`](../apps/dashboard/lib/aiSessionLogAnalyzer.ts) **in the client**. Session contents are **not** sent to `POST /api/analyze` as part of this flow. (Other features, such as Repo Coach, may call separate APIs if configured — see [`apps/dashboard/.env.example`](../apps/dashboard/.env.example).)

## Step-by-step

1. Open a **results** view that includes the AI Usage tab (research/results flows that render [`AIMaturityTab`](../apps/dashboard/components/results/rq/AIMaturityTab.tsx)).
2. Use **Upload** (or paste, if the UI exposes it) to load your export.
3. Review **warnings** — parse issues are listed explicitly (malformed lines, empty input, etc.).
4. Read the **scorecard**:
   - **Efficiency** (including **avg tools per prompt**, iteration vs discovery subscores)
   - **Safety / compliance** and **discovery depth**
   - **Archetype** and **top patterns** (rule-derived labels from the tool stream)
   - **Token totals** when `usage` data exists in the export
5. Use **demo data** in the tab if you want to explore the UI before loading real logs.

## Git-enriched metrics

Some planning-doc metrics (for example token ROI tied to git diffs) are **not** wired in the dashboard-only pipeline yet. The ARCHITECTURE note on session logs points here for **current** product behavior versus **planned** engine integration.

## Versioning

When you compare cohorts or student submissions over time, record:

- `logAnalyzerVersion` from the session report
- Exporter tool name and version (outside this repo)

Bump `LOG_ANALYZER_VERSION` when formula changes affect historical comparability (see planning doc).
