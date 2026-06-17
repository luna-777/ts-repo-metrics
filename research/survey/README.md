# Survey replication pipeline (SIP Sprint 1 — Objective 2)

Reproduce paper statistics (Friedman, Pearson, Cronbach's α) for the new Qualtrics cohort.

## Layout

```
research/survey/
├── README.md                 # this file
├── requirements.txt          # added by Student B in Sprint 1
├── data/
│   ├── raw/                  # gitignored — instructor Qualtrics export
│   └── processed/            # gitignored — cleaned responses
├── outputs/                  # gitignored — replication_report.md, tables
├── clean_qualtrics.py
├── stats_reliability.py
├── stats_friedman.py
├── stats_correlations.py
└── run_all.sh                # one-command reproducibility
```

## Getting started

1. Wait for instructor kickoff packet (see [`../KICKOFF_CHECKLIST.md`](../KICKOFF_CHECKLIST.md)).
2. Place de-identified export in `data/raw/`.
3. Follow story **SIP-1.2** on GitHub for task checklist.

## Paper reference

Target values and construct definitions: [`apps/dashboard/components/research/ResearchPaperBody.tsx`](../../apps/dashboard/components/research/ResearchPaperBody.tsx).
