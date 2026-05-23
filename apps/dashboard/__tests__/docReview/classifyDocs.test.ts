import { describe, expect, it, vi } from "vitest";
import { classifyDocs } from "../../lib/docReview/classifyDocs";
import type { FileWithText } from "../../lib/docReview/types";

function mockOpenAiSubmit(classifications: unknown[]) {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    id: "call_1",
                    type: "function",
                    function: {
                      name: "submit_classifications",
                      arguments: JSON.stringify({ classifications }),
                    },
                  },
                ],
              },
            },
          ],
        }),
      },
    },
  };
}

describe("classifyDocs (mocked OpenAI)", () => {
  it("classifies sprint plan abbreviations", async () => {
    const files: FileWithText[] = [
      { path: "docs/spr1.md", text: "# Sprint 1 Plan", bytes: 100, truncated: false },
      { path: "docs/spr2.md", text: "# Sprint 2 Plan", bytes: 100, truncated: false },
    ];
    const openai = mockOpenAiSubmit([
      { path: "docs/spr1.md", docType: "sprint_plan", sprintNumber: 1 },
      { path: "docs/spr2.md", docType: "sprint_plan", sprintNumber: 2 },
    ]);

    const result = await classifyDocs(
      files,
      ["docs/spr1.md", "docs/spr2.md"],
      [],
      openai as never,
    );

    expect(result).toHaveLength(2);
    expect(result[0]?.docType).toBe("sprint_plan");
    expect(result[0]?.sprintNumber).toBe(1);
    expect(result[1]?.sprintNumber).toBe(2);
  });

  it("classifies DoD outside docs folder from repo-wide pool", async () => {
    const files: FileWithText[] = [
      {
        path: "DEFINITION_OF_DONE.md",
        text: "# Definition of Done",
        bytes: 80,
        truncated: false,
      },
    ];
    const openai = mockOpenAiSubmit([
      { path: "DEFINITION_OF_DONE.md", docType: "definition_of_done" },
    ]);

    const result = await classifyDocs(files, [], ["DEFINITION_OF_DONE.md"], openai as never);
    expect(result[0]?.docType).toBe("definition_of_done");
  });

  it("falls back to unknown for all files on OpenAI failure", async () => {
    const files: FileWithText[] = [
      { path: "docs/meeting-notes.md", text: "notes", bytes: 10, truncated: false },
    ];
    const openai = {
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error("network")),
        },
      },
    };

    const result = await classifyDocs(
      files,
      ["docs/meeting-notes.md"],
      [],
      openai as never,
    );
    expect(result[0]?.docType).toBe("unknown");
  });
});
