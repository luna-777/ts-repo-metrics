# Survey replication (SIP Sprint 1 — Objective 2)

Reproduce paper statistics (Friedman, Pearson, Cronbach's α) for the new Qualtrics cohort.

## Analysis repo (separate clone)

The Python pipeline lives in **[AUM Survey Analytics](https://github.com/scottyUX/aum-survey-analytics)** — not in this repo (same pattern as [`agent_stats`](../AGENT_STATS_SETUP.md)).

```bash
git clone https://github.com/scottyUX/aum-survey-analytics.git
cd aum-survey-analytics
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
chmod +x run_all.sh
./run_all.sh /path/to/qualtrics_export.csv
```

## What to keep in this repo (`ts-repo-metrics`)

| Path | Purpose |
|------|---------|
| `research/survey/data/raw/` | Gitignored — place instructor Qualtrics export here for local work (optional; can also pass path directly to `run_all.sh`) |
| `research/survey/outputs/` | Gitignored row-level outputs; commit **`replication_report.md`** when done (SIP-1.2 task 6) |

## Pipeline scripts (in `aum-survey-analytics`)

| Script | Purpose |
|--------|---------|
| `clean_survey_phase1.py` | Clean Qualtrics export → `data/cleaned_survey.csv` |
| `build_analysis_dataset.py` | Likert → constructs → `data/analysis_dataset.csv` |
| `survey_phase3_analysis.py` | Descriptives, Pearson correlations, figures |
| `stats_reliability.py` | Cronbach's α per stage → `data/aum_reliability.csv` |
| `stats_inference.py` | Friedman + Wilcoxon → `data/friedman_results.csv`, `data/wilcoxon_aum_posthoc.csv` |
| `generate_survey_dashboard.py` | Regenerate `index.html` |
| `run_all.sh` | One-command full pipeline |

## Story tracker

Follow GitHub issue **SIP-1.2** ([#114](https://github.com/scottyUX/ts-repo-metrics/issues/114)).

## Paper reference

Target values and construct definitions: [`apps/dashboard/components/research/ResearchPaperBody.tsx`](../../apps/dashboard/components/research/ResearchPaperBody.tsx).
