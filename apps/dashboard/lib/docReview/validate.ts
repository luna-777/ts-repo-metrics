import type { DocType, StructuredReviewPayload, HolisticReviewPayload } from "./types";
import { HOLISTIC_DOC_TYPES, RUBRICS, STRUCTURED_DOC_TYPES } from "./rubrics";

export function validateChecklist(
  raw: Record<string, unknown>,
  expectedKeys: string[],
): Record<string, boolean> {
  const validated: Record<string, boolean> = {};
  for (const key of expectedKeys) {
    if (key in raw && typeof raw[key] === "boolean") {
      validated[key] = raw[key] as boolean;
    } else {
      validated[key] = false;
    }
  }
  return validated;
}

export function validateHolistic(raw: Record<string, unknown>): HolisticReviewPayload {
  return {
    strengths:
      typeof raw.strengths === "string" ? raw.strengths.slice(0, 1000) : "",
    improvements:
      typeof raw.improvements === "string" ? raw.improvements.slice(0, 1000) : "",
  };
}

export function validateCoach(raw: Record<string, unknown>): string {
  if (typeof raw.coach !== "string") return "";
  const gradeLanguage = /\b(grade|score|points?|percent|pass|fail|marks?|credit)\b/i;
  if (gradeLanguage.test(raw.coach)) return "";
  return raw.coach.slice(0, 800);
}

export type NormalizedReview =
  | { kind: "structured"; payload: StructuredReviewPayload }
  | { kind: "holistic"; payload: HolisticReviewPayload }
  | { kind: "invalid"; reason: string };

export function normalizeReviewByDocType(
  docType: DocType,
  raw: Record<string, unknown>,
): NormalizedReview {
  if (STRUCTURED_DOC_TYPES.has(docType)) {
    const rubric = RUBRICS[docType];
    if (!rubric) return { kind: "invalid", reason: "missing_rubric" };
    const checklist = validateChecklist(
      (raw.checklist as Record<string, unknown>) ?? {},
      rubric.keys,
    );
    const coach = validateCoach(raw);
    if (!raw.checklist || typeof raw.checklist !== "object") {
      return { kind: "invalid", reason: "missing_checklist" };
    }
    return { kind: "structured", payload: { checklist, coach } };
  }

  if (HOLISTIC_DOC_TYPES.has(docType)) {
    const payload = validateHolistic(raw);
    if (!payload.strengths && !payload.improvements) {
      return { kind: "invalid", reason: "missing_holistic_fields" };
    }
    return { kind: "holistic", payload };
  }

  return { kind: "invalid", reason: "unknown_doc_type" };
}
