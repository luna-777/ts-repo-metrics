import { describe, expect, it } from "vitest";
import { validateChecklist } from "../../lib/docReview/validate";

describe("validateChecklist", () => {
  it("strips extra keys from LLM output", () => {
    const raw = { heading_complete: true, invented_key: true };
    const validated = validateChecklist(raw, ["heading_complete"]);
    expect(validated).toEqual({ heading_complete: true });
    expect(validated).not.toHaveProperty("invented_key");
  });

  it("defaults missing keys to false", () => {
    const validated = validateChecklist({}, ["heading_complete"]);
    expect(validated).toEqual({ heading_complete: false });
  });
});
