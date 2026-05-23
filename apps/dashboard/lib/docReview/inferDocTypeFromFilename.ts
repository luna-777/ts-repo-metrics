import type { DocType } from "./types";

export interface FilenameInference {
  docType: DocType;
  sprintNumber?: number | null;
  language?: string | null;
}

function basename(path: string): string {
  return path.replace(/\\/g, "/").split("/").pop() ?? path;
}

function sprintNumberFromMatch(match: RegExpMatchArray | null): number | null {
  if (!match?.[1]) return null;
  const n = parseInt(match[1], 10);
  return n >= 1 && n <= 4 ? n : null;
}

/**
 * Deterministic doc-type hints from filename/path. Used before (and as fallback after) LLM classification.
 */
export function inferDocTypeFromFilename(path: string): FilenameInference | null {
  const base = basename(path).toLowerCase();
  const full = path.replace(/\\/g, "/").toLowerCase();

  let m: RegExpMatchArray | null;

  m = base.match(/sprint[_-]?(\d)[_-]?(?:report|rep|retrospective|retro)/);
  if (m) {
    return { docType: "sprint_report", sprintNumber: sprintNumberFromMatch(m) };
  }

  m = base.match(/(?:^|[_-])s(\d)[_-]?(?:report|rep|retrospective|retro)/);
  if (m) {
    return { docType: "sprint_report", sprintNumber: sprintNumberFromMatch(m) };
  }

  m = base.match(/sprint[_-]?(\d)[_-]?(?:plan|planning|pln)/);
  if (m) {
    return { docType: "sprint_plan", sprintNumber: sprintNumberFromMatch(m) };
  }

  m = base.match(/(?:^|[_-])s(\d)[_-]?(?:plan|planning|pln)/);
  if (m) {
    return { docType: "sprint_plan", sprintNumber: sprintNumberFromMatch(m) };
  }

  m = base.match(/^spr(\d)(?:[_-]|\.|$)/);
  if (m) {
    return { docType: "sprint_plan", sprintNumber: sprintNumberFromMatch(m) };
  }

  m = base.match(/(?:^|[_-])sp(\d)[_-]?(?:rep|report|plan)/);
  if (m) {
    const n = sprintNumberFromMatch(m);
    const isReport = /rep|report|retro/.test(base);
    return {
      docType: isReport ? "sprint_report" : "sprint_plan",
      sprintNumber: n,
    };
  }

  if (/(?:^|[_-])(?:release[_-]?plan|releasepl|rel[_-]?plan)/.test(base)) {
    return { docType: "release_plan" };
  }

  if (/(?:^|[_-])(?:test[_-]?plan|testplan|system[_-]?test)/.test(base)) {
    return { docType: "test_plan" };
  }

  if (
    /(?:definition[_-]?of[_-]?done|def[_-]?done|\bdod\b)/.test(base) ||
    /definition[_-]?of[_-]?done/.test(full)
  ) {
    return { docType: "definition_of_done" };
  }

  if (/(?:code[_-]?standards?|codestds?|coding[_-]?standards?|style[_-]?guide)/.test(base)) {
    const langMatch = base.match(
      /(?:typescript|ts|javascript|js|python|py|java|kotlin|swift|go|ruby|rust|c\+\+|cpp)/,
    );
    const language = langMatch
      ? langMatch[0].replace(/^py$/, "python").replace(/^ts$/, "typescript").replace(/^js$/, "javascript")
      : null;
    return { docType: "code_standards", language };
  }

  return null;
}
