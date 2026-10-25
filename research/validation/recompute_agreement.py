#!/usr/bin/env python3
"""
Recompute the cross-tool agreement figures from the pseudonymized join.

Input: paired_measurements_pseudonymized.csv, one row per inventory function.
Repository names are P-codes, and file paths and function names are salted
SHA-256 hashes, so the student repositories cannot be recovered from the file.
Start lines and every tool's metric values are unchanged.

For each metric family this reports the number of paired functions, the
exact-agreement rate and Spearman's rho, computed the same way as
family_stats() in analyze.py:

  structural  ours_cyclomatic       vs ts-complex  tsc_cyclomatic
  cognitive   ours_cognitive        vs sonarjs     sonar_cognitive
  lexical     ours_halstead_volume  vs escomplex   esc_halstead_volume
              ("exact" means within 1% relative difference)

A row counts when our engine matched the function and both sides produced a
value. Standard library only, so it runs without installing anything:

  python3 research/validation/recompute_agreement.py [path/to/csv]
"""
import csv
import math
import os
import sys

# Same tolerance as VOLUME_REL_TOL in analyze.py.
VOLUME_REL_TOL = 0.01

FAMILIES = (
    ("structural", "ours_cyclomatic", "tsc_cyclomatic", None),
    ("cognitive", "ours_cognitive", "sonar_cognitive", None),
    ("lexical", "ours_halstead_volume", "esc_halstead_volume", VOLUME_REL_TOL),
)

DEFAULT_CSV = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "paired_measurements_pseudonymized.csv")


def _truthy(v):
    return v.strip().lower() in ("true", "1", "yes")


def average_ranks(values):
    """1-based ranks with ties given their mean rank, as scipy.stats.rankdata."""
    order = sorted(range(len(values)), key=lambda i: values[i])
    ranks = [0.0] * len(values)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
            j += 1
        for k in range(i, j + 1):
            ranks[order[k]] = (i + j) / 2 + 1
        i = j + 1
    return ranks


def pearson(x, y):
    n = len(x)
    mx, my = sum(x) / n, sum(y) / n
    sxy = sum((a - mx) * (b - my) for a, b in zip(x, y))
    sxx = sum((a - mx) ** 2 for a in x)
    syy = sum((b - my) ** 2 for b in y)
    if sxx == 0 or syy == 0:
        return float("nan")
    return sxy / math.sqrt(sxx * syy)


def family_stats(rows, ours_key, base_key, exact_rel_tol=None):
    pairs = [(float(r[ours_key]), float(r[base_key])) for r in rows
             if _truthy(r["ours_matched"]) and r[ours_key] != "" and r[base_key] != ""]
    if not pairs:
        return {"n": 0}
    ours = [p[0] for p in pairs]
    base = [p[1] for p in pairs]
    if exact_rel_tol is None:
        exact = sum(1 for o, b in pairs if o == b)
    else:
        exact = sum(1 for o, b in pairs if abs(o - b) / max(abs(b), 1e-12) <= exact_rel_tol)
    return {
        "n": len(pairs),
        "exact_agreement": exact,
        "exact_agreement_rate": exact / len(pairs),
        "spearman_rho": pearson(average_ranks(ours), average_ranks(base)),
    }


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CSV
    with open(path, newline="") as f:
        rows = list(csv.DictReader(f))
    repos = sorted({r["repo"] for r in rows})
    print(f"{path}: {len(rows)} functions across {len(repos)} repositories")
    for name, ours_key, base_key, tol in FAMILIES:
        s = family_stats(rows, ours_key, base_key, tol)
        if s["n"] == 0:
            print(f"  {name:<10} no paired rows")
            continue
        print(f"  {name:<10} n={s['n']:<5} exact={100 * s['exact_agreement_rate']:.2f}%"
              f"  rho={s['spearman_rho']:.4f}")


if __name__ == "__main__":
    main()
