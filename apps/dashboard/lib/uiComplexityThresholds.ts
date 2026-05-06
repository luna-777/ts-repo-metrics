/**
 * Shared cyclomatic cutoffs for Code Quality UI: Complexity Distribution card,
 * hotspot Risk badges, and related copy.
 * (Engine aggregates like `highComplexityFunctions` still use threshold > 10 in packages/engine.)
 */
export const UI_COMPLEXITY_HEALTHY_LT = 10;
export const UI_COMPLEXITY_HIGH_GT = 15;
export const UI_COMPLEXITY_CRITICAL_GT = 30;
