# AI Usage: analyzing uploaded CSV traces

This guide describes the current dashboard **AI Usage** tab. The tab now works from the raw
`ai_usage_trace.csv` export produced by `agent_stats`, then persists that raw CSV on the
analysis record so the metrics reload with the result page.

## What you can upload

The tab accepts **CSV only**.

Recommended export:

```bash
./ai_usage_stats.py --filter your-repo-slug --messages --tokens
```

That command keeps the base event stream and adds the optional columns needed for:

- **Prompt quality** (`message_text`)
- **Token efficiency** (`input_tokens`, `output_tokens`, `cache_creation_tokens`, `cache_read_tokens`)

## CSV contract

Required columns:

- `timestamp`
- `event_type`
- `session_id`
- `tool_name`

Optional columns:

- `message_text`
- `input_tokens`
- `output_tokens`
- `cache_creation_tokens`
- `cache_read_tokens`

The parser and metric derivation logic live in
[`apps/dashboard/lib/aiUsageCsv.ts`](../apps/dashboard/lib/aiUsageCsv.ts).

## What the tab shows

The refreshed tab is student-facing and organized around:

- **Token efficiency**
- **Prompt quality**
- **Activity snapshot** with a fixed **40-day** view
- **Workflow pattern** with grouped behavioral buckets:
  - `Exploration`
  - `Generation`
  - `Verification / execution`
- **Session behavior**
- **Review habits**

Every card includes a `?` help affordance that explains:

1. what the data is
2. why it matters
3. how to improve it

## Persistence

When you upload a CSV on the AI Usage tab:

1. the browser reads the file locally
2. the dashboard parses it into metrics for immediate display
3. the raw CSV text is saved on the matching `analyses.result_id`

This is separate from `POST /api/analyze`; it uses dedicated AI Usage persistence endpoints.

## Step-by-step

1. Open a **results** view that includes the AI Usage tab (the page renders
   [`AIMaturityTab`](../apps/dashboard/components/results/rq/AIMaturityTab.tsx)).
2. Export `ai_usage_trace.csv` with `--messages --tokens` for the richest metrics.
3. Upload the CSV on the AI Usage tab.
4. Review any warnings about missing optional columns.
5. Read the sections in order:
   - token efficiency
   - prompt quality
   - activity snapshot
   - workflow pattern
   - session behavior
   - review habits

## Notes

- There is **no demo data** in the current tab.
- The tab no longer accepts **JSON** or **JSONL** uploads.
- The old **AUM score** and stage-aware display are no longer part of the live student UI.
