import { describe, expect, it } from "vitest";
import { AI_USAGE_METRIC_HELP } from "../components/results/rq/aiUsageSignalHelpContent";

describe("aiUsage help content", () => {
  it("covers the surfaced metric cards", () => {
    expect(Object.keys(AI_USAGE_METRIC_HELP)).toEqual(
      expect.arrayContaining([
        "input-tokens",
        "output-tokens",
        "cache-hit-rate",
        "tokens-per-prompt",
        "avg-prompt-length",
        "detailed-prompt-rate",
        "short-prompt-rate",
        "message-capture-rate",
        "total-prompts",
        "total-tool-calls",
        "active-days",
        "prompts-per-day",
        "exploration-share",
        "generation-share",
        "verification-share",
        "workflow-diagnostic",
        "sessions",
        "avg-prompts-per-session",
        "avg-tools-per-session",
        "tool-calls-per-prompt",
        "write-ratio",
        "read-after-write-rate",
      ]),
    );
  });

  it("keeps a complete what / why / how structure for every metric", () => {
    for (const entry of Object.values(AI_USAGE_METRIC_HELP)) {
      expect(entry.title.trim().length).toBeGreaterThan(0);
      expect(entry.what.trim().length).toBeGreaterThan(0);
      expect(entry.why.trim().length).toBeGreaterThan(0);
      expect(entry.how.trim().length).toBeGreaterThan(0);
    }
  });
});
