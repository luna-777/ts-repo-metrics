/**
 * Pure SDLC stage classification and AUM scoring used by the AI Usage tab.
 */

export type SDLCStage =
  | "Planning"
  | "Implementation"
  | "Testing"
  | "Deployment"
  | "Maintenance";

export const STAGE_PATTERNS: Array<{ stage: SDLCStage; patterns: RegExp[] }> =
  [
    {
      stage: "Testing",
      patterns: [
        /[/\\]__tests__[/\\]/i,
        /[/\\]tests?[/\\]/i,
        /[/\\]spec[/\\]/i,
        /\.test\.[jt]sx?$/i,
        /\.spec\.[jt]sx?$/i,
        /\.test\.py$/i,
        /\.spec\.py$/i,
        /[/\\]cypress[/\\]/i,
        /[/\\]e2e[/\\]/i,
        /[/\\]fixtures?[/\\]/i,
        /[/\\]mocks?[/\\]/i,
      ],
    },
    {
      stage: "Deployment",
      patterns: [
        /dockerfile/i,
        /docker-compose/i,
        /[/\\]\.github[/\\]workflows[/\\]/i,
        /[/\\]\.gitlab-ci/i,
        /[/\\]\.circleci[/\\]/i,
        /[/\\]deploy[/\\]/i,
        /[/\\]infra[/\\]/i,
        /[/\\]terraform[/\\]/i,
        /[/\\]k8s[/\\]/i,
        /[/\\]kubernetes[/\\]/i,
        /[/\\]ci[/\\]/i,
      ],
    },
    {
      stage: "Planning",
      patterns: [
        /[/\\]docs?[/\\]/i,
        /readme/i,
        /[/\\]planning[/\\]/i,
        /[/\\]requirements?[/\\]/i,
        /[/\\]design[/\\]/i,
        /[/\\]architecture[/\\]/i,
        /[/\\]rfcs?[/\\]/i,
        /\.md$/i,
        /\.txt$/i,
      ],
    },
    {
      stage: "Maintenance",
      patterns: [
        /package\.json$/i,
        /package-lock\.json$/i,
        /yarn\.lock$/i,
        /[/\\]migrations?[/\\]/i,
        /[/\\]scripts?[/\\]/i,
        /\.config\.[jt]s$/i,
        /eslint/i,
        /prettier/i,
        /tsconfig/i,
        /vite\.config/i,
        /webpack\.config/i,
      ],
    },
    {
      stage: "Implementation",
      patterns: [
        /[/\\]src[/\\]/i,
        /[/\\]app[/\\]/i,
        /[/\\]components?[/\\]/i,
        /[/\\]pages?[/\\]/i,
        /[/\\]lib[/\\]/i,
        /[/\\]utils?[/\\]/i,
        /[/\\]hooks?[/\\]/i,
        /[/\\]services?[/\\]/i,
        /[/\\]api[/\\]/i,
        /[/\\]models?[/\\]/i,
        /\.[jt]sx?$/i,
        /\.py$/i,
      ],
    },
  ];

export function classifyStageByPath(workingDir: string): SDLCStage | null {
  if (!workingDir?.trim()) return null;
  const normalized = workingDir.replace(/\\/g, "/");
  for (const { stage, patterns } of STAGE_PATTERNS) {
    if (patterns.some((re) => re.test(normalized))) return stage;
  }
  return "Implementation";
}

export function classifyStageByTimestamp(
  ts: number,
  start: number,
  end: number,
): SDLCStage {
  const range = end - start;
  if (range <= 0) return "Implementation";
  const pct = (ts - start) / range;
  if (pct < 0.15) return "Planning";
  if (pct < 0.65) return "Implementation";
  if (pct < 0.8) return "Testing";
  if (pct < 0.9) return "Deployment";
  return "Maintenance";
}

export function computeAUMScore(
  avgIter: number,
  avgVerif: number,
  sessionCount: number,
): number {
  if (sessionCount === 0) return 0;
  const iterationScore = Math.max(0, 100 - (avgIter - 1) * 15);
  const verificationScore = avgVerif * 100;
  return Math.round(0.5 * iterationScore + 0.5 * verificationScore);
}
