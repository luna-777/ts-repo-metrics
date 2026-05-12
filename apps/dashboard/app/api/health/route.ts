import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Railway / load-balancer liveness: cheap GET, no auth. */
export function GET() {
  return NextResponse.json({ ok: true });
}
