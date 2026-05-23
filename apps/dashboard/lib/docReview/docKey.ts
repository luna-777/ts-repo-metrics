import type { ClassifiedDoc } from "./types";

export function docKey(doc: Pick<ClassifiedDoc, "docType" | "sprintNumber">): string {
  if (doc.docType === "unknown") return "unknown";
  if (doc.sprintNumber != null) {
    return `${doc.docType}_${doc.sprintNumber}`;
  }
  return doc.docType;
}

/** First path-sorted occurrence keeps duplicate=false; later same docKey get duplicate=true. */
export function markDuplicateClassifications(
  classified: ClassifiedDoc[],
): ClassifiedDoc[] {
  const seen = new Set<string>();
  const sorted = [...classified].sort((a, b) => a.path.localeCompare(b.path));

  return sorted.map((doc) => {
    if (doc.docType === "unknown") {
      return { ...doc, duplicate: false };
    }
    const key = docKey(doc);
    if (seen.has(key)) {
      return { ...doc, duplicate: true };
    }
    seen.add(key);
    return { ...doc, duplicate: false };
  });
}
