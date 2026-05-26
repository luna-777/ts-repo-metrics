import type { ClassifiedDoc, FileWithText } from "./types";

function classifyFile(file: FileWithText): ClassifiedDoc {
  const base = {
    path: file.path,
    text: file.text,
    truncated: file.truncated,
  };

  const segments = file.path.replace(/\\/g, "/").split("/");
  const filename = (segments[segments.length - 1] ?? "").toLowerCase();

  // sprint-{n}-plan.md
  const sprintPlanMatch = /^sprint-([1-9])-plan\.md$/.exec(filename);
  if (sprintPlanMatch) {
    return {
      ...base,
      docType: "sprint_plan",
      sprintNumber: Number(sprintPlanMatch[1]),
    };
  }

  // sprint-{n}-report.md
  const sprintReportMatch = /^sprint-([1-9])-report\.md$/.exec(filename);
  if (sprintReportMatch) {
    return {
      ...base,
      docType: "sprint_report",
      sprintNumber: Number(sprintReportMatch[1]),
    };
  }

  if (filename === "release-plan.md") {
    return { ...base, docType: "release_plan" };
  }

  if (filename === "test-plan.md") {
    return { ...base, docType: "test_plan" };
  }

  if (filename === "definition-of-done.md") {
    return { ...base, docType: "definition_of_done" };
  }

  if (filename === "code-standards.md") {
    return { ...base, docType: "code_standards" };
  }

  return { ...base, docType: "unknown" };
}

export async function classifyDocs(
  files: FileWithText[],
  _docsPool: string[],
  _repoWide: string[],
  _openai: unknown,
): Promise<ClassifiedDoc[]> {
  return files.map(classifyFile);
}
