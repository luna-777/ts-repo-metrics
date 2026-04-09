# Metrics concepts (Phase 2 + research framing)

This document complements [SCHEMA.md](SCHEMA.md) with citations and interpretation guidance for **lexical** (Halstead), **structural** (cyclomatic), **cognitive** (Sonar-style), and **GRAD-AI** per-function maintainability metrics.

## Tri-metric framing (dissertation / committee)

We are not only counting lines. The engine performs a **tri-metric** analysis:

- **Lexical** — Halstead-style volume from operators and operands (including modern TypeScript: `?.`, `??`, spread, arrows).
- **Structural** — Cyclomatic complexity (branch points and logical operators).
- **Cognitive** — Nesting-aware additive score aligned with Sonar-style cognitive complexity.

Together, these support claims that AI-assisted code may look *neat* (low SLOC) while **volume** and **cognitive load** remain high—helping explain **verification difficulty**.

## Verification Gap (RQ3)

**High cognitive complexity** can be interpreted as a driver of the **Verification Gap**: when static cognitive load is high but **review density** (or related survey constructs) is low, students may have accepted code they did not fully verify. Cross-link survey fields when those columns exist in your dataset.

## Maintainability: two indices

| Report field | Meaning |
|--------------|---------|
| `maintainability` (repo-level) | Coleman-style index from average cyclomatic complexity, total LOC, and average function length ([maintainabilityIndex.ts](../packages/engine/src/extract/maintainabilityIndex.ts)). |
| `maintainabilityIndexGradAiRaw` / `Norm` (per function) | GRAD-AI-style: `MI_raw = 171 - 5.2·ln(V) - 0.23·CC - 16.2·ln(LOC)`; `MI_norm = max(0, MI_raw·100/171)`. Use **`MI_norm`** for dashboards and cohort charts. |

## References

- Coleman, D. et al. (1994). *IEEE Computer* — classical Maintainability Index (repo-level variant in this tool).
- Gambo, I., et al. (2025). GRAD-AI — automated grading / MI-style coefficients for `MI_raw` / normalization. *Education and Information Technologies*.
- Imai, S. (2022). Software quality and AI-assisted development; Halstead-style volume as lexical richness. *Information and Software Technology*.
- Jönsson, A., & Wehbi, N. (2025). Code quality of AI-generated mobile applications. Blekinge Institute of Technology.
- Bollu, P. (2024). Maintainability in React web applications. Tampere University (related to RQ3 React metrics).

See also [planning/RQ3_REACT_METRICS_IMPLEMENTATION.md](planning/RQ3_REACT_METRICS_IMPLEMENTATION.md) for TSX-specific RQ3 metrics.

## Dashboard: threshold calibration

The **Results** dashboard **Phase 2 — Lexical & cognitive** tab applies **conditional cell tinting** to `MI_norm`, cyclomatic complexity (CC), and cognitive complexity using fixed bands documented in-app:

| Metric | Green | Yellow | Red | Primary sources (interpretation) |
|--------|--------|--------|-----|----------------------------------|
| **MI_norm** (0–100) | ≥85 | 65–84 | &lt;65 | Gambo et al. (2025) GRAD-AI; Microsoft-style MI bands |
| **CC** | ≤10 | 11–20 | &gt;20 | McCabe (1976); NIST / testing-coverage practice |
| **Cognitive** | ≤8 | 9–15 | &gt;15 | SonarSource-style; Jönsson & Wehbi (2025) |

Implementation: [`apps/dashboard/lib/phase2Traffic.ts`](../apps/dashboard/lib/phase2Traffic.ts). The collapsible **Threshold calibration** panel and **Metric glossary** (definitions, formulas, citations) explain provenance for committee-facing use. **React component share** is a separate structural-density / domain-filter metric (heuristic: `.tsx`, PascalCase or JSX in body); see glossary in [`MetricGlossary.tsx`](../apps/dashboard/components/results/rq/MetricGlossary.tsx).
