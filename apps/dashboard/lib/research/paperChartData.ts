/**
 * Shared numeric data for research charts and PaperTables rows.
 * Table 2 (descriptives) and Table 4 (AU–AUM correlations) anchor Figures 1 and 3.
 */

export const SDL_STAGES_SHORT = ["Plan", "Des", "Imp", "Tst", "Dep", "Mnt"] as const;

export type SdlStage = (typeof SDL_STAGES_SHORT)[number];

export interface StageDescriptorRow {
  stage: string;
  auMean: number;
  auSd: number;
  auN: number;
  aumMean: number;
  aumSd: number;
  aumN: number;
}

export const STAGE_DESCRIPTIVES: StageDescriptorRow[] = [
  { stage: "Planning", auMean: 3.19, auSd: 1.42, auN: 85, aumMean: 3.73, aumSd: 1.13, aumN: 85 },
  { stage: "Design", auMean: 3.2, auSd: 0.66, auN: 54, aumMean: 3.5, aumSd: 0.52, aumN: 64 },
  { stage: "Implementation", auMean: 3.39, auSd: 1.24, auN: 85, aumMean: 3.84, aumSd: 0.97, aumN: 85 },
  { stage: "Testing", auMean: 2.98, auSd: 0.72, auN: 49, aumMean: 3.25, aumSd: 0.68, aumN: 59 },
  { stage: "Deployment", auMean: 2.96, auSd: 0.65, auN: 53, aumMean: 3.15, aumSd: 0.55, aumN: 61 },
  { stage: "Maintenance", auMean: 3.09, auSd: 0.68, auN: 58, aumMean: 3.22, aumSd: 0.62, aumN: 64 },
];

export interface Fig1Datum {
  idx: number;
  labelShort: SdlStage;
  /** Full SDLC stage name (x-axis labels) */
  stage: string;
  auMean: number;
  auSe: number;
  auSd: number;
  auN: number;
  aumMean: number;
  aumSe: number;
  aumSd: number;
  aumN: number;
}

function se(sd: number, n: number): number {
  if (n <= 0) return 0;
  return sd / Math.sqrt(n);
}

export const FIG1_LINE_DATA: Fig1Datum[] = STAGE_DESCRIPTIVES.map((row, idx) => ({
  idx,
  labelShort: SDL_STAGES_SHORT[idx],
  stage: row.stage,
  auMean: row.auMean,
  auSe: se(row.auSd, row.auN),
  auSd: row.auSd,
  auN: row.auN,
  aumMean: row.aumMean,
  aumSe: se(row.aumSd, row.aumN),
  aumSd: row.aumSd,
  aumN: row.aumN,
}));

/** Y-axis bounds for Fig 1 (Likert-relevant framing). */
export const FIG1_Y_AXIS = { min: 2.5, max: 4.5, label: "Mean score (1–5 Likert scale)" } as const;

/** Friedman tests on matched subsamples (methods / results prose). */
export const FIG1_FRIEDMAN = {
  au: { chi2: 5.04, df: 5, p: 0.41 as number, n: 35 },
  aum: { chi2: 66.13, df: 5, p: "<.001" as const, n: 48 },
} as const;

export type PVal = "<.001" | number;

export interface StageAuAumCorrRow {
  stage: string;
  rAuAum: number;
  auAumP: PVal;
  nAuAum: number;
}

/** Table 4 — full stage correlation rows (AU–AUM and PU–AU). */
export interface StageCorrTableRow extends StageAuAumCorrRow {
  rPuAu: number;
  pPuAu: PVal;
  nPuAu: number;
}

export const STAGE_CORR_TABLE_ROWS: StageCorrTableRow[] = [
  { stage: "Planning", rAuAum: 0.671, auAumP: "<.001", nAuAum: 85, rPuAu: 0.839, pPuAu: "<.001", nPuAu: 85 },
  { stage: "Design", rAuAum: 0.268, auAumP: 0.063, nAuAum: 49, rPuAu: 0.643, pPuAu: "<.001", nPuAu: 50 },
  { stage: "Implementation", rAuAum: 0.462, auAumP: "<.001", nAuAum: 85, rPuAu: 0.552, pPuAu: "<.001", nPuAu: 85 },
  { stage: "Testing", rAuAum: 0.278, auAumP: 0.061, nAuAum: 46, rPuAu: 0.46, pPuAu: 0.002, nPuAu: 43 },
  { stage: "Deployment", rAuAum: 0.443, auAumP: 0.001, nAuAum: 49, rPuAu: 0.447, pPuAu: 0.001, nPuAu: 49 },
  { stage: "Maintenance", rAuAum: 0.164, auAumP: 0.224, nAuAum: 57, rPuAu: 0.568, pPuAu: "<.001", nPuAu: 55 },
];

export const STAGE_AU_AUM_CORR: StageAuAumCorrRow[] = STAGE_CORR_TABLE_ROWS.map(
  ({ stage, rAuAum, auAumP, nAuAum }) => ({ stage, rAuAum, auAumP, nAuAum })
);

/** Significant Pearson AU–AUM correlation at stage (p &lt; .05). */
export function auAumSignificantStrict(p: PVal): boolean {
  if (p === "<.001") return true;
  return p < 0.05;
}

/** Friedman on stage-wise mean gaps (AUM − AU) — companion inference text. */
export const FIG1_GAP_FRIEDMAN = { chi2: 45.2, df: 5, p: "<.001" as const } as const;

/** Companion gap chart framing (pairs with shaded clusters on the main line chart). */
export const FIG1_GAP_CHART_TITLE = "COMPANION — MEAN GAP (AUM − AU)" as const;

export const FIG1_GAP_CLUSTER_HIGH_GAP = ["Planning", "Design", "Implementation"] as const;
export const FIG1_GAP_CLUSTER_LOW_GAP = ["Testing", "Deployment", "Maintenance"] as const;

export const FIG1_GAP_THRESHOLD = {
  value: 0.3 as number,
  label: "Maturity-Usage Decoupling Point",
} as const;

/** Manuscript-aligned summary keyed to plotted gaps. */
export const FIG1_GAP_CLUSTER_INSIGHT =
  "The gap narrows from 0.54 (Planning) to 0.13 (Maintenance): the maturity advantage over usage frequency is largest earlier in the lifecycle and diminishes in later phases.";

export interface Fig1GapChartRow {
  stage: string;
  gap: number;
  calculation: string;
  auMean: number;
  aumMean: number;
  /** 100 × gap / AU mean — “percent higher maturity than usage” wording. */
  pctHigherVsAu: number;
  highGapCluster: boolean;
  interpretation: string;
  rAuAum: number;
  auAumP: PVal;
  nAuAum: number;
  significantAuAumCoupling: boolean;
}

/** Short correlation suffix for annotations (Pearson AU–AUM by stage). */
export function corrStarsFromP(p: PVal): string {
  if (p === "<.001") return "***";
  if (typeof p === "number" && p < 0.001) return "***";
  if (typeof p === "number" && p < 0.01) return "**";
  if (typeof p === "number" && p < 0.05) return "*";
  return "n.s.";
}

/** Authoritative gap rows (means match Table 2; gaps match plotted AUM − AU). */
const FIG1_GAP_SPECS = [
  {
    stage: "Planning",
    gap: 0.54,
    calculation: "3.73 - 3.19",
    interpretation:
      "Students use AI frequently and maturely during planning — strong iterative maturity alongside heavier engagement.",
  },
  {
    stage: "Design",
    gap: 0.3,
    calculation: "3.50 - 3.20",
    interpretation:
      "Intermediate gap: iterative maturity exceeds usage modestly; AU–AUM coupling is trending but marginal at conventional α.",
  },
  {
    stage: "Implementation",
    gap: 0.45,
    calculation: "3.84 - 3.39",
    interpretation:
      "Elevated coupling again under build pressure — mastery-oriented practices coexist with sustained tool use.",
  },
  {
    stage: "Testing",
    gap: 0.27,
    calculation: "3.25 - 2.98",
    interpretation:
      "Gap contracts in verification — AU and AUM draw closer as practices become less deliberately structured.",
  },
  {
    stage: "Deployment",
    gap: 0.19,
    calculation: "3.15 - 2.96",
    interpretation:
      "Near parity on release — maturity advantage over raw usage narrows substantially.",
  },
  {
    stage: "Maintenance",
    gap: 0.13,
    calculation: "3.22 - 3.09",
    interpretation:
      "Smallest gap: opportunistic, task-driven use with limited separation from reported maturity framing.",
  },
] as const;

function fig1PctHigherVsAu(auMean: number, gap: number): number {
  if (!(auMean > 1e-6)) return 0;
  return Math.round((gap / auMean) * 100);
}

export const FIG1_GAP_CHART_ROWS: Fig1GapChartRow[] = FIG1_GAP_SPECS.map((spec) => {
  const corr = STAGE_CORR_TABLE_ROWS.find((r) => r.stage === spec.stage)!;
  const desc = STAGE_DESCRIPTIVES.find((r) => r.stage === spec.stage)!;
  const highGapCluster = (FIG1_GAP_CLUSTER_HIGH_GAP as readonly string[]).includes(spec.stage);
  return {
    stage: spec.stage,
    gap: spec.gap,
    calculation: spec.calculation,
    auMean: desc.auMean,
    aumMean: desc.aumMean,
    pctHigherVsAu: fig1PctHigherVsAu(desc.auMean, spec.gap),
    highGapCluster,
    interpretation: spec.interpretation,
    rAuAum: corr.rAuAum,
    auAumP: corr.auAumP,
    nAuAum: corr.nAuAum,
    significantAuAumCoupling: auAumSignificantStrict(corr.auAumP),
  };
});

/** Legacy shape consumed by concise exports; aligns with plotted companion bars. */
export const FIG1_AUM_MINUS_AU: { stage: string; gap: number }[] = FIG1_GAP_CHART_ROWS.map(({ stage, gap }) => ({
  stage,
  gap,
}));

export interface ScatterPoint {
  au: number;
  aum: number;
}

const FIG2_SAMPLE_R = 0.69;
export const FIG2_SAMPLE_N = 85;

/** Mulberry32 PRNG seed (deterministic illustration only). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return (): number => {
    a += 0x6d2b79f5;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalPair(rng: () => number): [number, number] {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return [Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v), Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v)];
}

function dot(a: readonly number[], b: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function sum(vals: readonly number[]): number {
  let s = 0;
  for (let i = 0; i < vals.length; i++) s += vals[i];
  return s;
}

function centered(vals: readonly number[]): number[] {
  const mean = sum(vals) / vals.length;
  return vals.map((v) => v - mean);
}

/**
 * Builds N AU/AUM Likert-ish points whose Pearson r ≈ FIG2_SAMPLE_R exactly
 * via orthogonal residuals in centered space plus separate affines per axis.
 */
function buildExactCorrScatter(seed: number, n: number, rTarget: number): ScatterPoint[] {
  const rnd = mulberry32(seed);

  /** Independent standard normals via Box-Muller */
  const xRaw: number[] = [];
  const zRaw: number[] = [];
  for (let i = 0; i < n; i++) {
    xRaw.push(normalPair(rnd)[0]);
    zRaw.push(normalPair(rnd)[0]);
  }

  const xc = centered(xRaw);
  const zc = centered(zRaw);

  /** Standardized predictor (mean 0, sample variance ≈ 1) */
  const varX = dot(xc, xc) / Math.max(n - 1, 1);
  const sx = Math.sqrt(Math.max(varX, 1e-12));
  const ux = xc.map((v) => v / sx);

  const coefUx = dot(zc, ux) / Math.max(dot(ux, ux), 1e-12);
  const ec = zc.map((v, i) => v - coefUx * ux[i]);
  const varE = dot(ec, ec) / Math.max(n - 1, 1);
  const sy = Math.sqrt(Math.max(varE, 1e-12));
  const uy = ec.map((v) => v / sy);

  /** Orthogonal standardized components ⇒ exact finite-sample corr rTarget */
  const yLin = ux.map((u, i) => rTarget * u + Math.sqrt(Math.max(0, 1 - rTarget * rTarget)) * uy[i]);

  const loAU = 1.2;
  const hiAU = 4.7;
  const loAUM = 2.15;
  const hiAUM = 4.05;

  /** Affine preserves Pearson correlation */
  const auMin = Math.min(...xc);
  const auMax = Math.max(...xc);
  const auRg = auMax - auMin || 1;

  const aumMin = Math.min(...yLin);
  const aumMax = Math.max(...yLin);
  const aumRg = aumMax - aumMin || 1;

  return xc.map((xv, i) => ({
    au: loAU + ((xv - auMin) / auRg) * (hiAU - loAU),
    aum: loAUM + ((yLin[i] - aumMin) / aumRg) * (hiAUM - loAUM),
  }));
}

export const FIG2_SCATTER_SYNTHETIC_POINTS: ScatterPoint[] = buildExactCorrScatter(0xa11ce71, FIG2_SAMPLE_N, FIG2_SAMPLE_R);

export function pearsonR(xs: readonly number[], ys: readonly number[]): number {
  const n = xs.length;
  if (n < 2 || ys.length !== n) return NaN;
  const mx = xs.reduce((a, x) => a + x, 0) / n;
  const my = ys.reduce((a, y) => a + y, 0) / n;
  let cxx = 0;
  let cyy = 0;
  let cxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    cxx += dx * dx;
    cyy += dy * dy;
    cxy += dx * dy;
  }
  const d = Math.sqrt(cxx * cyy);
  return d < 1e-12 ? 0 : cxy / d;
}

function olsSlopeIntercept(xs: readonly number[], ys: readonly number[]): { b0: number; b1: number; sse: number; sErr: number; xMean: number; sxx: number } {
  const n = xs.length;
  const xMean = xs.reduce((a, x) => a + x, 0) / n;
  const yMean = ys.reduce((a, y) => a + y, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    sxx += dx * dx;
    sxy += dx * (ys[i] - yMean);
  }
  const b1 = sxx > 1e-12 ? sxy / sxx : 0;
  const b0 = yMean - b1 * xMean;
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const r = ys[i] - (b0 + b1 * xs[i]);
    sse += r * r;
  }
  const df = n - 2;
  const sigma2 = df > 0 ? sse / df : 0;
  const sErr = Math.sqrt(Math.max(sigma2, 0));
  return { b0, b1, sse, sErr, xMean, sxx };
}

/** ~97.5% two-sided t critical for regression CI (reasonable for n=83). */
const T975_DF83 = 1.989;

export interface Fig2BandPoint {
  au: number;
  fit: number;
  bandBase: number;
  bandWidth: number;
}

function buildScatterRegression(points: ScatterPoint[]): {
  scatter: ScatterPoint[];
  regression: { r: number; b0: number; b1: number };
  bandSeries: Fig2BandPoint[];
} {
  const au = points.map((p) => p.au);
  const aum = points.map((p) => p.aum);
  const r = pearsonR(au, aum);
  const { b0, b1, sErr, xMean, sxx } = olsSlopeIntercept(au, aum);

  const n = points.length;
  const auGridMin = Math.min(...au);
  const auGridMax = Math.max(...au);
  const gridSteps = 40;
  const bandSeries: Fig2BandPoint[] = [];
  for (let i = 0; i <= gridSteps; i++) {
    const t = gridSteps <= 1 ? 0 : i / gridSteps;
    const auPt = auGridMin + t * (auGridMax - auGridMin);
    const fit = b0 + b1 * auPt;
    /** Standard error of predicted mean μ̂(x) */
    const seMean = Math.sqrt(Math.max(0, sErr ** 2 * (1 / n + (auPt - xMean) ** 2 / Math.max(sxx, 1e-12))));
    const margin = T975_DF83 * seMean;
    bandSeries.push({
      au: auPt,
      fit,
      bandBase: fit - margin,
      bandWidth: 2 * margin,
    });
  }

  return { scatter: points, regression: { r, b0, b1 }, bandSeries };
}

export const FIG2_MODEL = buildScatterRegression(FIG2_SCATTER_SYNTHETIC_POINTS);

export const FIG2_META = {
  reportedR: FIG2_SAMPLE_R,
  illustratedN: FIG2_SAMPLE_N,
  subtitle:
    "Points are synthetic, chosen so the Pearson r matches the reported value; replace with anonymized CSV when available.",
} as const;



/** Figure 4 — full Planning Pearson correlation matrix (canonical ids; order = heatmap axes). */
export const PLANNING_CORREL_VARIABLE_IDS = [
  "PEOU",
  "PU",
  "BI",
  "AU(plan)",
  "AI lit.",
  "Facil.",
  "AU overall",
  "AUM overall",
] as const;

export type PlanningCorrelationVariable = (typeof PLANNING_CORREL_VARIABLE_IDS)[number];

export const PLANNING_CORREL_VARIABLE_DESCRIPTIONS: Record<PlanningCorrelationVariable, string> = {
  PEOU: "Perceived Ease of Use",
  PU: "Perceived Usefulness",
  BI: "Behavioral Intention",
  "AU(plan)": "AI Usage (Planning stage)",
  "AI lit.": "AI Literacy",
  "Facil.": "Facilitating Conditions",
  "AU overall": "Overall AI Usage",
  "AUM overall": "Overall AI Usage Maturity",
};

/** 8×8 symmetric Pearson r (matches published figure matrix; aligned to `PLANNING_CORREL_VARIABLE_IDS`). */
export const PLANNING_CORRELATION_DATA: readonly (readonly number[])[] = [
  [1.0, 0.7, 0.64, 0.68, 0.3, 0.29, 0.5, 0.37],
  [0.7, 1.0, 0.83, 0.76, 0.22, 0.28, 0.76, 0.46],
  [0.64, 0.83, 1.0, 0.72, 0.31, 0.24, 0.74, 0.49],
  [0.68, 0.76, 0.72, 1.0, 0.1, 0.08, 0.79, 0.48],
  [0.3, 0.22, 0.31, 0.1, 1.0, 0.3, 0.23, 0.3],
  [0.29, 0.28, 0.24, 0.08, 0.3, 1.0, 0.07, 0.13],
  [0.5, 0.76, 0.74, 0.79, 0.23, 0.07, 1.0, 0.56],
  [0.37, 0.46, 0.49, 0.48, 0.3, 0.13, 0.56, 1.0],
];

/** Manuscript-highlight pairs — decorative ring only; numbers always come from `PLANNING_CORRELATION_DATA`. */
export const PLANNING_CORRELATION_HIGHLIGHTS: ReadonlyArray<readonly [PlanningCorrelationVariable, PlanningCorrelationVariable]> =
  [["PU", "BI"], ["PU", "AU(plan)"], ["AU(plan)", "AU overall"], ["AU(plan)", "AUM overall"]];

export function planningVarIndex(id: PlanningCorrelationVariable): number {
  return PLANNING_CORREL_VARIABLE_IDS.indexOf(id);
}

function planningHighlightSymKeys(): ReadonlySet<string> {
  const s = new Set<string>();
  for (const pair of PLANNING_CORRELATION_HIGHLIGHTS) {
    const ia = planningVarIndex(pair[0]);
    const ib = planningVarIndex(pair[1]);
    const lo = Math.min(ia, ib);
    const hi = Math.max(ia, ib);
    s.add(`${lo}-${hi}`);
  }
  return s;
}

export const PLANNING_CORRELATION_HIGHLIGHT_KEYS = planningHighlightSymKeys();

function formatCorrelationAxisLabel(id: PlanningCorrelationVariable): string {
  switch (id) {
    case "AU(plan)":
      return "AU\n(plan)";
    case "AU overall":
      return "AU\n(overall)";
    case "AUM overall":
      return "AUM\n(overall)";
    default:
      return id;
  }
}

/** Row/column tick labels aligned to `PLANNING_CORRELATION_DATA`. */
export const PLANNING_HEATMAP_LABELS = PLANNING_CORREL_VARIABLE_IDS.map(formatCorrelationAxisLabel);

/**
 * Warm sequential ramp — near-white/yellow cream → apricot → deep coral (YlOrRd-style plots).
 */
export function planningCorrelationWarmColor(r: number): { bg: string; useLightFg: boolean } {
  const t = Math.min(1, Math.max(0, r));
  const L = 99 - t * 48;
  const C = 0.004 + t * 0.185;
  const H = 100 - t * 58;
  const bg = `oklch(${L.toFixed(2)}% ${C.toFixed(3)} ${H.toFixed(0)})`;
  const useLightFg = L < 64;
  return { bg, useLightFg };
}

/** Matches cell fill scale for footer legend stripe */
export function planningCorrelationLegendHorizontalGradientCSS(): string {
  const steps = 32;
  const chunks: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const r = i / steps;
    const { bg } = planningCorrelationWarmColor(r);
    chunks.push(`${bg} ${(100 * i) / steps}%`);
  }
  return `linear-gradient(to right, ${chunks.join(", ")})`;
}
