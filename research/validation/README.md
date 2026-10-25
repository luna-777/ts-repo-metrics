# Metric-validity evaluation

Cross-tool agreement between our engine and three independent baselines:

| Family     | Our metric      | Baseline                                |
|------------|-----------------|-----------------------------------------|
| structural | cyclomatic      | ts-complex (TS compiler API)            |
| cognitive  | cognitive       | eslint-plugin-sonarjs (typed ESLint AST) |
| lexical    | Halstead volume | typhonjs-escomplex (babel-parser)       |

## Recomputing the published numbers

`paired_measurements_pseudonymized.csv` is the function-level join from the
analyzer 0.2.0 run (`analyzer_version: "0.2.0"`): 4,631 functions across 5
repositories. Four of them are student course projects, labelled P8 to P11.
The fifth is this repository, labelled `ts-repo-metrics`.

To protect the students, repository names are replaced by P-codes, and file
paths and function names are replaced by salted SHA-256 hashes. The salt is
not published. Start lines and every tool's metric values are unchanged, so
the agreement statistics can be recomputed exactly:

```bash
python3 research/validation/recompute_agreement.py
```

This needs only the Python 3 standard library and prints:

```
structural n=4631  exact=99.81%  rho=0.9972
cognitive  n=4631  exact=92.44%  rho=0.9768
lexical    n=4542  exact=6.49%  rho=0.9038
```

Exact agreement and Spearman's rho are computed as in `family_stats()` in
`analyze.py`. For Halstead volume, "exact" means within 1% relative difference.

## Rerunning the whole pipeline

`run_validation.sh` builds the engine, fetches the corpus in `corpus.json`,
runs all four tools and writes a fresh join through `analyze.py`. The student
repositories in `corpus.json` are pseudonymized (`example-org/P8` and so on,
with hashed commits), so a third party can rerun the pipeline end to end only
on a corpus of their own, such as the `self` entry or any public TypeScript
repositories added to `corpus.json`. The published figures can be checked
from the pseudonymized CSV above.

`post_fix/` and `pre_fix_baseline/` hold earlier runs from before the 0.2.0
release (analyzer 0.0.0). They are kept for the record and are not the
published numbers.
