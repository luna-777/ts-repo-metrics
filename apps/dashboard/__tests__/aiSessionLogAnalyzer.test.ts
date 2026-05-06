import { describe, expect, it } from "vitest";
import {
  computeSessionLogReport,
  DEMO_SESSION_LOG_REPORT,
  parseSessionLogText,
  normalizedEventsToCsv,
} from "../lib/aiSessionLogAnalyzer";

describe("aiSessionLogAnalyzer", () => {
  const csvLikeJsonl = `
{"event_type":"user_prompt","session_id":"s1","timestamp":"2025-01-01T00:00:00.000Z","working_dir":"/proj/src/foo.ts"}
{"event_type":"tool_call","tool_name":"Glob","session_id":"s1","timestamp":"2025-01-01T00:00:01.000Z","working_dir":"/proj"}
{"event_type":"tool_call","tool_name":"Write","session_id":"s1","timestamp":"2025-01-01T00:00:02.000Z","working_dir":"/proj"}
{"event_type":"tool_call","tool_name":"Read","session_id":"s1","timestamp":"2025-01-01T00:00:03.000Z","working_dir":"/proj"}
`;

  it("parses CSV-shaped JSONL and produces discovery ratio + CSV round-trip", () => {
    const { events, warnings, format } = parseSessionLogText(csvLikeJsonl);
    expect(warnings.length).toBe(0);
    expect(format).toBe("jsonl");
    expect(events.filter((e) => e.toolName !== "__usage__").length).toBeGreaterThan(0);

    const csv = normalizedEventsToCsv(events);
    expect(csv).toContain("event_type,tool_name");
    expect(csv).toContain("user_prompt");

    const report = computeSessionLogReport(events, warnings, format);
    expect(report.logAnalyzerVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(report.metrics.discoveryRatio).not.toBeNull();
    expect(report.archetype.length).toBeGreaterThan(0);
    expect(report.scorecard.efficiencyBreakdown).toBeDefined();
    expect(typeof report.scorecard.efficiencyBreakdown.avgToolsPerPrompt).toBe("number");
  });

  it("aggregates usage blocks from nested JSON", () => {
    const text = JSON.stringify([
      {
        role: "assistant",
        content: [{ type: "tool_use", name: "Read", input: { file_path: "x.ts" } }],
        usage: { input_tokens: 1000, output_tokens: 50 },
      },
    ]);
    const { events, warnings } = parseSessionLogText(text);
    expect(warnings.length).toBe(0);
    const report = computeSessionLogReport(events, warnings, "json");
    expect(report.tokens.hasUsageData).toBe(true);
    expect(report.tokens.input).toBe(1000);
    expect(report.tokens.output).toBe(50);
  });

  it("exposes demo session report for AI Usage tab", () => {
    expect(DEMO_SESSION_LOG_REPORT.scorecard.efficiency).toBeGreaterThan(0);
    expect(DEMO_SESSION_LOG_REPORT.tokens.hasUsageData).toBe(true);
    expect(DEMO_SESSION_LOG_REPORT.top_patterns.length).toBeGreaterThan(0);
    expect(DEMO_SESSION_LOG_REPORT.scorecard.efficiencyBreakdown.avgToolsPerPrompt).toBeGreaterThan(0);
    expect(DEMO_SESSION_LOG_REPORT.scorecard.efficiencyBreakdown.iterScore).toBeGreaterThan(0);
  });
});
