/**
 * GET /api/github/dashboard
 * Authenticated user's GitHub profile + repo list (server uses stored OAuth token).
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
const MAX_REPOS = 500;

function parseLinkNext(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const parts = linkHeader.split(",");
  for (const part of parts) {
    const m = part.match(/<([^>]+)>;\s*rel="next"/);
    if (m) return m[1]!;
  }
  return null;
}

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
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: `Bearer ${token}`,
      },
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
      console.error("[github/dashboard] GET /user failed:", userRes.status, text);
      return NextResponse.json(
        { error: "Failed to load GitHub profile" },
        { status: 502 },
      );
    }

    const ghUser = (await userRes.json()) as {
      login: string;
      name: string | null;
      avatar_url: string;
      html_url: string;
      followers: number;
      following: number;
      public_repos: number;
    };

    const repos: Array<{
      name: string;
      fullName: string;
      htmlUrl: string;
      private: boolean;
      description: string | null;
      language: string | null;
      stargazersCount: number;
      forksCount: number;
      updatedAt: string;
    }> = [];

    let nextUrl: string | null =
      `${GITHUB_API}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member`;

    while (nextUrl && repos.length < MAX_REPOS) {
      const repoRes = await fetch(nextUrl, {
        headers: {
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          Authorization: `Bearer ${token}`,
        },
      });

      if (repoRes.status === 401) {
        return NextResponse.json(
          {
            error: "GitHub rejected the token. Sign out and sign in again.",
            code: "github_unauthorized",
          },
          { status: 403 },
        );
      }

      if (!repoRes.ok) {
        const text = await repoRes.text();
        console.error(
          "[github/dashboard] repos fetch failed:",
          repoRes.status,
          text,
        );
        return NextResponse.json(
          { error: "Failed to load repositories" },
          { status: 502 },
        );
      }

      const batch = (await repoRes.json()) as Array<{
        name: string;
        full_name: string;
        html_url: string;
        private: boolean;
        description: string | null;
        language: string | null;
        stargazers_count: number;
        forks_count: number;
        updated_at: string;
      }>;

      for (const r of batch) {
        repos.push({
          name: r.name,
          fullName: r.full_name,
          htmlUrl: r.html_url,
          private: r.private,
          description: r.description,
          language: r.language,
          stargazersCount: r.stargazers_count,
          forksCount: r.forks_count,
          updatedAt: r.updated_at,
        });
      }

      nextUrl = parseLinkNext(repoRes.headers.get("link"));
    }

    return NextResponse.json({
      profile: {
        login: ghUser.login,
        name: ghUser.name,
        avatarUrl: ghUser.avatar_url,
        htmlUrl: ghUser.html_url,
        followers: ghUser.followers,
        following: ghUser.following,
        publicRepos: ghUser.public_repos,
      },
      repos,
    });
  } catch (err) {
    console.error("[github/dashboard]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
