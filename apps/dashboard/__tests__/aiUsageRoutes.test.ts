import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const fromSelect = vi.fn();
const fromEq = vi.fn();
const fromMaybeSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  })),
  isDevReportMemoryFallback: vi.fn(() => true),
  isSupabaseConfigured: vi.fn(() => false),
}));

vi.mock("@/lib/supabase/server-user", () => ({
  createUserSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser,
    },
    from: fromSelect,
  })),
  isUserSupabaseConfigured: vi.fn(() => true),
}));

vi.mock("@/lib/analyzeConstants", () => ({
  ANALYZE_SIGN_IN_REQUIRED_MESSAGE: "Please sign in.",
}));

describe("ai usage routes", () => {
  beforeEach(() => {
    vi.resetModules();
    getUser.mockReset();
    fromSelect.mockReset();
    fromEq.mockReset();
    fromMaybeSingle.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    fromSelect.mockReturnValue({
      select: fromEq,
    });
    fromEq.mockReturnValue({
      eq: fromMaybeSingle,
    });
    fromMaybeSingle.mockResolvedValue({
      data: { result_id: "owner-repo-abc", user_id: "user-1" },
      error: null,
    });
  });

  it("stores and retrieves AI usage CSV in dev fallback mode", async () => {
    const { POST } = await import("../app/api/ai-usage/route");
    const { GET } = await import("../app/api/results/[id]/ai-usage/route");

    const csvText =
      "timestamp,event_type,session_id,tool_name\n2026-05-20T10:00:00.000Z,user_prompt,s1,\n";

    const postResponse = await POST(
      new NextRequest("http://localhost/api/ai-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId: "owner-repo-abc", csvText }),
      }),
    );
    expect(postResponse.status).toBe(200);
    await expect(postResponse.json()).resolves.toEqual({
      resultId: "owner-repo-abc",
      csvText,
    });

    const getResponse = await GET(
      new NextRequest("http://localhost/api/results/owner-repo-abc/ai-usage"),
      { params: Promise.resolve({ id: "owner-repo-abc" }) },
    );
    expect(getResponse.status).toBe(200);
    await expect(getResponse.json()).resolves.toEqual({
      resultId: "owner-repo-abc",
      csvText,
    });
  });

  it("rejects empty uploads", async () => {
    const { POST } = await import("../app/api/ai-usage/route");

    const response = await POST(
      new NextRequest("http://localhost/api/ai-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultId: "owner-repo-abc", csvText: "   " }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringContaining("Missing csvText"),
    });
  });
});
