import type { ClassifiedDoc, ConsistencyWarning } from "./types";
import type { RepoReport } from "@/lib/reportTypes";
import { docKey } from "./docKey";

function languagesForCoverage(report: RepoReport | null | undefined): string[] {
  const langs = report?.github?.languages ?? [];
  if (!langs.length) return [];

  const sorted = [...langs].sort((a, b) => b.bytes - a.bytes);
  const top3 = new Set(sorted.slice(0, 3).map((l) => l.language));
  const meaningful = langs.filter(
    (l) => top3.has(l.language) || l.percentage >= 5,
  );
  return meaningful.map((l) => l.language);
}

export function runConsistencyChecks(
  classified: ClassifiedDoc[],
  engineReport: RepoReport | null | undefined,
): { warnings: ConsistencyWarning[] } {
  const warnings: ConsistencyWarning[] = [];

  const keyToPaths = new Map<string, string[]>();
  for (const doc of classified) {
    if (doc.docType === "unknown") continue;
    const key = docKey(doc);
    const paths = keyToPaths.get(key) ?? [];
    paths.push(doc.path);
    keyToPaths.set(key, paths);
  }

  for (const [key, paths] of keyToPaths) {
    if (paths.length > 1) {
      warnings.push({
        code: "duplicate_doc_key",
        message: `Multiple files classified as ${key}: ${paths.join(", ")}`,
        severity: "warning",
      });
    }
  }

  for (const doc of classified) {
    if (
      doc.sprintNumber != null &&
      (doc.sprintNumber < 1 || doc.sprintNumber > 4)
    ) {
      warnings.push({
        code: "invalid_sprint_number",
        message: `${doc.path}: sprint number ${doc.sprintNumber} is outside 1–4`,
        severity: "warning",
      });
    }
  }

  const releasePlans = classified.filter((d) => d.docType === "release_plan");
  if (releasePlans.length > 1) {
    warnings.push({
      code: "multiple_release_plans",
      message: `Found ${releasePlans.length} release_plan documents`,
      severity: "warning",
    });
  }

  if (!classified.some((d) => d.docType === "release_plan")) {
    warnings.push({
      code: "missing_release_plan",
      message: "No release_plan document classified",
      severity: "info",
    });
  }

  if (!classified.some((d) => d.docType === "definition_of_done")) {
    warnings.push({
      code: "missing_definition_of_done",
      message: "No definition_of_done document classified",
      severity: "info",
    });
  }

  const standardsDocs = classified.filter((d) => d.docType === "code_standards");
  const repoLangs = languagesForCoverage(engineReport);

  if (repoLangs.length && standardsDocs.length === 0) {
    warnings.push({
      code: "no_code_standards_docs",
      message: `Repository uses ${repoLangs.join(", ")} but no code_standards document was classified`,
      severity: "warning",
    });
  }

  const hasGeneralStandards = standardsDocs.some(
    (d) => !d.language || d.language.toLowerCase() === "general",
  );

  if (!hasGeneralStandards) {
    for (const lang of repoLangs) {
      const covered = standardsDocs.some(
        (d) => d.language?.toLowerCase() === lang.toLowerCase(),
      );
      if (!covered) {
        warnings.push({
          code: "language_coverage_gap",
          message: `No code standards document found for ${lang} (detected in repo)`,
          severity: "warning",
        });
      }
    }
  }

  return { warnings };
}
