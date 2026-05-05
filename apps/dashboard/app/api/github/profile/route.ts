/**
 * GET /api/github/profile
 * Authenticated user's GitHub profile summary for the header dropdown (no repo enumeration).
 */

import { NextResponse } from "next/server";
import {
  createUserSupabaseServerClient,
  isUserSupabaseConfigured,
} from "@/lib/supabase/server-user";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getDecryptedGitHubTokenForUser } from "@/lib/userGitHubToken";

export const runtime = "nodejs";

const GITHUB_API = "https://api.github.com";

const ghHeaders = (token: string) => ({
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  Authorization: `Bearer ${token}`,
});

export async function GET() {
  try {
    if (!isUserSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Authentication is not configured." },
        { status: 503 },
      );
    }

    const userSb = await createUserSupabaseServerClient();
    const {
      data: { user },
    } = await userSb.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error: "Server storage is not configured.",
          code: "supabase_missing",
        },
        { status: 503 },
      );
    }

    const token = await getDecryptedGitHubTokenForUser(user.id);
    if (!token) {
      return NextResponse.json(
        {
          error:
            "GitHub token not available. Sign out and sign in again with GitHub.",
          code: "github_token_missing",
        },
        { status: 403 },
      );
    }

    const userRes = await fetch(`${GITHUB_API}/user`, {
      headers: ghHeaders(token),
    });

    if (userRes.status === 401) {
      return NextResponse.json(
        {
          error: "GitHub rejected the token. Sign out and sign in again.",
          code: "github_unauthorized",
        },
        { status: 403 },
      );
    }

    if (!userRes.ok) {
      const text = await userRes.text();
      console.error("[github/profile] GET /user failed:", userRes.status, text);
      return NextResponse.json(
        { error: "Failed to load GitHub profile" },
        { status: 502 },
      );
    }

    const raw = (await userRes.json()) as {
      login: string;
      name: string | null;
      avatar_url: string;
      html_url: string;
      bio: string | null;
      followers: number;
      following: number;
      public_repos: number;
      total_private_repos?: number;
    };

    const privateRepos = raw.total_private_repos ?? 0;
    const hasPrivateField = typeof raw.total_private_repos === "number";
    const repoCount = hasPrivateField
      ? raw.public_repos + privateRepos
      : raw.public_repos;
    const repoCountLabel = hasPrivateField
      ? `${repoCount} repositories`
      : `${raw.public_repos} public repositories`;

    const orgs: Array<{ login: string; avatarUrl: string }> = [];
    const orgRes = await fetch(`${GITHUB_API}/user/orgs?per_page=8`, {
      headers: ghHeaders(token),
    });

    if (orgRes.ok) {
      const orgList = (await orgRes.json()) as Array<{
        login: string;
        avatar_url: string;
      }>;
      for (const o of orgList) {
        orgs.push({ login: o.login, avatarUrl: o.avatar_url });
      }
    }

    return NextResponse.json({
      profile: {
        login: raw.login,
        name: raw.name,
        avatarUrl: raw.avatar_url,
        htmlUrl: raw.html_url,
        bio: raw.bio,
        followers: raw.followers,
        following: raw.following,
        publicRepos: raw.public_repos,
        repoCount,
        repoCountLabel,
      },
      orgs,
    });
  } catch (err) {
    console.error("[github/profile]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
