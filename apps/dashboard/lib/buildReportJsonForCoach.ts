/**
 * Builds a parseable JSON string of the repo report for the coach API.
 * Never uses naive string slicing on JSON.stringify output — reduces structure in code until it fits.
 */
import type {
  PerFileEntry,
  RepoReport,
  ReactComponentMetrics,
} from "@/lib/reportTypes";

/** Client POST body safety; server applies its own cap too. */
export const MAX_REPORT_JSON_CHARS_CLIENT = 180_000;

function capArray<T>(arr: T[] | undefined, n: number): T[] {
  if (!arr || arr.length <= n) return arr ?? [];
  return arr.slice(0, n);
}

function topFunctionsByComplexity(fm: PerFileEntry["functionMetrics"], n: number) {
  if (!fm?.length) return [];
  const sorted = [...fm].sort(
    (a, b) => (b.cyclomaticComplexity ?? 0) - (a.cyclomaticComplexity ?? 0),
  );
  return sorted.slice(0, n);
}

function compactPerFile(entries: PerFileEntry[], maxFiles: number, maxFn: number): PerFileEntry[] {
  return capArray(entries, maxFiles).map((e) => ({
    ...e,
    functionMetrics: topFunctionsByComplexity(e.functionMetrics, maxFn),
    complexity: capArray(e.complexity, maxFn),
  }));
}

function compactReactComponents(comps: ReactComponentMetrics[], n: number) {
  const sorted = [...comps].sort((a, b) => b.lines - a.lines);
  return sorted.slice(0, n);
}

export interface ReportJsonForCoachResult {
  /** Minified JSON or null if it cannot be kept under budget. */
  json: string | null;
  /** True when structure was reduced; json may still be null if still too large. */
  reduced: boolean;
}

type Density = "full" | "medium" | "minimal" | "tiny";

function buildReducedReport(report: RepoReport, density: Density): RepoReport {
  const maxFiles =
    density === "full" ? 80 : density === "medium" ? 35 : density === "minimal" ? 12 : 0;
  const maxFn =
    density === "full" ? 25 : density === "medium" ? 12 : density === "minimal" ? 6 : 0;
  const maxReact =
    density === "full" ? 45 : density === "medium" ? 20 : density === "minimal" ? 8 : 0;
  const maxChurn = density === "full" ? 25 : density === "medium" ? 12 : 6;
  const maxContributors = density === "full" ? 20 : density === "medium" ? 8 : 4;
  const maxSilent = density === "full" ? 40 : density === "medium" ? 18 : 8;
  const maxSymbolRisk = density === "full" ? 80 : density === "medium" ? 35 : 0;

  const perFile =
    maxFiles > 0 ? compactPerFile(report.perFile ?? [], maxFiles, maxFn) : [];

  let gitMetricsV2 = report.gitMetricsV2;
  if (gitMetricsV2 && density !== "full") {
    gitMetricsV2 = {
      ...gitMetricsV2,
      churn: {
        topByModifications: capArray(
          gitMetricsV2.churn.topByModifications as { file?: string }[],
          maxChurn,
        ) as typeof gitMetricsV2.churn.topByModifications,
        topByLinesChanged: capArray(
          gitMetricsV2.churn.topByLinesChanged as { file?: string }[],
          maxChurn,
        ) as typeof gitMetricsV2.churn.topByLinesChanged,
      },
    };
  }

  let reactMetrics = report.reactMetrics;
  if (reactMetrics) {
    if (maxReact === 0) {
      reactMetrics = {
        summary: reactMetrics.summary,
        components: [],
      };
    } else if (reactMetrics.components.length > maxReact) {
      reactMetrics = {
        summary: reactMetrics.summary,
        components: compactReactComponents(reactMetrics.components, maxReact),
      };
    }
  }

  let phase3 = report.phase3;
  if (phase3 && density !== "full") {
    phase3 = {
      ...phase3,
      silentFailureEvents: capArray(phase3.silentFailureEvents, maxSilent),
    };
  }

  let contributors = report.contributors;
  if (contributors?.length) {
    contributors = capArray(contributors, maxContributors);
  }

  let symbolVerificationRisks = report.symbolVerificationRisks;
  if (maxSymbolRisk === 0) {
    symbolVerificationRisks = undefined;
  } else if (symbolVerificationRisks?.length) {
    symbolVerificationRisks = capArray(symbolVerificationRisks, maxSymbolRisk);
  }

  return {
    ...report,
    perFile,
    gitMetricsV2: gitMetricsV2 ?? report.gitMetricsV2,
    reactMetrics,
    phase3,
    contributors,
    symbolVerificationRisks,
  };
}

/**
 * @param maxChars — use MAX_REPORT_JSON_CHARS_CLIENT on client; server may pass a lower cap.
 */
export function buildReportJsonForCoach(
  report: RepoReport,
  maxChars: number,
): ReportJsonForCoachResult {
  const order: Density[] = ["full", "medium", "minimal", "tiny"];

  for (let i = 0; i < order.length; i++) {
    const density = order[i]!;
    const json = JSON.stringify(buildReducedReport(report, density));
    if (json.length <= maxChars) {
      return { json, reduced: i > 0 };
    }
  }

  // tiny still too large: minimal scalar-only payload (always small)
  const fallback = {
    source: report.source,
    profile: report.profile,
    complexity: report.complexity,
    smells: report.smells,
    functionMetricsSummary: report.functionMetricsSummary,
    maintainerNote:
      "Full per-file and extended metrics were omitted because the report exceeds the coach JSON size limit. Use REPORT_SUMMARY and UI for detail.",
  };
  const j = JSON.stringify(fallback);
  if (j.length <= maxChars) {
    return { json: j, reduced: true };
  }

  return { json: null, reduced: true };
}
