"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Upload,
  BookOpen,
  Brain,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Lightbulb,
  BarChart3,
  Wrench,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  analyzeSessionLogFile,
  DEMO_SESSION_LOG_REPORT,
  type SessionLogReport,
} from "@/lib/aiSessionLogAnalyzer";
import { useCoachExplain } from "@/lib/repoCoachContext";
import {
  buildAiMaturityAggregateCoachPrompt,
  buildAiMaturityFullTabCoachPrompt,
  buildAiMaturityPlaybookCoachPrompt,
  buildAiMaturitySessionCoachPrompt,
} from "@/lib/aiMaturityExplainPrompts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SDLCStage = "Planning" | "Implementation" | "Testing" | "Deployment" | "Maintenance";

interface AUMStageScore {
  stage: SDLCStage;
  label: string;
  aumScore: number;
  auSessions: number;
  iterationsPerPrompt: number;
  verificationRatio: number;
  coupled: boolean;
  insight: string;
  noData?: boolean;
}

interface ToolMix {
  name: string;
  count: number;
  pct: number;
  color: string;
  meaning: string;
}

interface AUMData {
  totalPrompts: number;
  totalSessions: number;
  totalToolCalls: number;
  avgIterationsPerPrompt: number;
  writeRatio: number;
  sessionConcentration: number;
  stageScores: AUMStageScore[];
  toolMix: ToolMix[];
  isDemoData: boolean;
}

// ---------------------------------------------------------------------------
// Stage classifier
// ---------------------------------------------------------------------------

const STAGE_PATTERNS: Array<{ stage: SDLCStage; patterns: RegExp[] }> = [
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

function classifyStageByPath(workingDir: string): SDLCStage | null {
  if (!workingDir?.trim()) return null;
  const normalized = workingDir.replace(/\\/g, "/");
  for (const { stage, patterns } of STAGE_PATTERNS) {
    if (patterns.some((re) => re.test(normalized))) return stage;
  }
  return "Implementation";
}

function classifyStageByTimestamp(ts: number, start: number, end: number): SDLCStage {
  const range = end - start;
  if (range <= 0) return "Implementation";
  const pct = (ts - start) / range;
  if (pct < 0.15) return "Planning";
  if (pct < 0.65) return "Implementation";
  if (pct < 0.80) return "Testing";
  if (pct < 0.90) return "Deployment";
  return "Maintenance";
}

// ---------------------------------------------------------------------------
// AUM score formula
// ---------------------------------------------------------------------------

function computeAUMScore(avgIter: number, avgVerif: number, sessionCount: number): number {
  if (sessionCount === 0) return 0;
  const iterationScore = Math.max(0, 100 - (avgIter - 1) * 15);
  const verificationScore = avgVerif * 100;
  return Math.round(0.5 * iterationScore + 0.5 * verificationScore);
}

// ---------------------------------------------------------------------------
// Stage config (coaching copy)
// ---------------------------------------------------------------------------

const STAGE_CONFIG: Array<{
  stage: SDLCStage;
  label: string;
  coupled: boolean;
  matureInsight: string;
  opportunisticInsight: string;
}> = [
  {
    stage: "Planning",
    label: "Planning & Design",
    coupled: true,
    matureInsight: "Strong planning habits detected. The paper shows Planning AUM predicts whole-lifecycle behavior (r = 0.80).",
    opportunisticInsight: "Low verification in planning suggests vague, exploratory AI use. Structured pre-coding prompts can fix this.",
  },
  {
    stage: "Implementation",
    label: "Implementation",
    coupled: true,
    matureInsight: "Healthy iterative prompting. Watch the Write ratio — unreviewed generated files lower maturity.",
    opportunisticInsight: "High iterations during implementation suggest prompts are too broad. Break problems into smaller, specified asks.",
  },
  {
    stage: "Testing",
    label: "Testing",
    coupled: false,
    matureInsight: "Unusually disciplined AI use in testing. Most students lose structure here — maintain it.",
    opportunisticInsight: "High iterations suggest vague test-generation prompts. The paper shows this is where most students lose discipline.",
  },
  {
    stage: "Deployment",
    label: "Deployment",
    coupled: false,
    matureInsight: "Good verification of AI-suggested config changes. This is the hardest stage to stay disciplined.",
    opportunisticInsight: "Low verification ratio means AI-suggested config changes aren't being validated before use.",
  },
  {
    stage: "Maintenance",
    label: "Maintenance",
    coupled: false,
    matureInsight: "Structured AI use in maintenance. Rare — this usually becomes opportunistic under deadline pressure.",
    opportunisticInsight: "Lowest maturity stage. Usage here is purely opportunistic with no structured verification loop.",
  },
];

// ---------------------------------------------------------------------------
// Demo data (mirrors paper findings: high AUM early, low AUM late)
// ---------------------------------------------------------------------------

const DEMO_DATA: AUMData = {
  totalPrompts: 142,
  totalSessions: 18,
  totalToolCalls: 874,
  avgIterationsPerPrompt: 4.3,
  writeRatio: 0.31,
  sessionConcentration: 58,
  isDemoData: true,
  stageScores: STAGE_CONFIG.map((c, i) => {
    const scores = [78, 71, 38, 32, 29];
    const sessions = [4, 8, 3, 2, 1];
    const iters = [3.1, 4.2, 7.8, 6.1, 9.2];
    const verif = [0.72, 0.61, 0.28, 0.21, 0.18];
    const score = scores[i];
    return {
      stage: c.stage,
      label: c.label,
      aumScore: score,
      auSessions: sessions[i],
      iterationsPerPrompt: iters[i],
      verificationRatio: verif[i],
      coupled: c.coupled,
      insight: score >= 55 ? c.matureInsight : c.opportunisticInsight,
    };
  }),
  toolMix: [
    { name: "Read", count: 312, pct: 36, color: "bg-foreground/80", meaning: "Exploratory — AI reading your codebase for context" },
    { name: "Edit", count: 254, pct: 29, color: "bg-foreground/55", meaning: "Targeted changes — surgical, good sign" },
    { name: "Write", count: 201, pct: 23, color: "bg-foreground/35", meaning: "Code generation — review carefully before committing" },
    { name: "Bash", count: 107, pct: 12, color: "bg-foreground/20", meaning: "Operational — AI running commands, tests, builds" },
  ],
};

function buildAumBriefForCoach(data: AUMData): Record<string, unknown> {
  return {
    totalPrompts: data.totalPrompts,
    totalSessions: data.totalSessions,
    totalToolCalls: data.totalToolCalls,
    avgIterationsPerPrompt: data.avgIterationsPerPrompt,
    writeRatio: data.writeRatio,
    sessionConcentration: data.sessionConcentration,
    isDemoData: data.isDemoData,
    stages: data.stageScores.map((s) => ({
      stage: s.stage,
      aumScore: s.aumScore,
      auSessions: s.auSessions,
      iterationsPerPrompt: s.iterationsPerPrompt,
      verificationRatio: s.verificationRatio,
      noData: !!s.noData,
    })),
    toolMix: data.toolMix.map((t) => ({ name: t.name, pct: t.pct, count: t.count })),
  };
}

/** Opens Repo Coach with a dynamic prompt — same UX idea as CoachExplainButton + RQ2. */
function CoachAiActionButton({
  prompt,
  send,
  children,
  tooltip,
}: {
  prompt: string;
  send: ((message: string) => void) | null;
  children: ReactNode;
  tooltip: string;
}) {
  const disabled = !send;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2 shrink-0"
          aria-label={tooltip}
          onClick={() => send?.(prompt)}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-sm text-xs">
        {disabled
          ? "Repo Coach is unavailable until the assistant panel loads on this results page."
          : tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function SessionCoachTipSnapshot({ report }: { report: SessionLogReport }) {
  const dr = report.metrics.discoveryRatio;
  const shellTest = report.metrics.verificationTestCommandRatio;
  const raw = report.metrics.readAfterWriteRate;
  const loops = report.metrics.stuck.totalLoops;
  const discoveryPct = dr != null ? Math.round(dr * 100) : null;
  const shellPct = shellTest != null ? Math.round(shellTest * 100) : null;
  const rawPct = raw != null ? Math.round(raw * 100) : null;

  return (
    <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm">
      <p className="font-semibold text-foreground flex items-center gap-2">
        <Lightbulb className="size-4 shrink-0" aria-hidden />
        Coach&apos;s tip (plain English)
      </p>
      <p className="text-muted-foreground mt-2 leading-relaxed">
        {discoveryPct != null ? (
          <>
            Your discovery share of labeled discovery+action calls is about{" "}
            <strong>{discoveryPct}%</strong>.{" "}
            {discoveryPct < 25
              ? "That leans write-heavy — try one targeted grep or read of the interface before large edits. "
              : "That suggests you often ground the model before big changes. "}
          </>
        ) : null}
        {rawPct != null ? (
          <>
            Read-after-write on Write/Edit→Read pairs is about <strong>{rawPct}%</strong> of those
            sequences in this export (a proxy, not perfection).{" "}
          </>
        ) : null}
        {shellPct != null ? (
          <>
            Shell invocations that look test-like are about <strong>{shellPct}%</strong> of shell tool
            calls.{" "}
          </>
        ) : null}
        {loops >= 2 ? (
          <>
            Similar tool+path repeats flagged <strong>{loops}</strong> loop(s) — pause, shrink the task, or
            simplify the hot path before another attempt.{" "}
          </>
        ) : (
          "Loop signal is low this run — still watch for friction on the top file if errors cluster there. "
        )}
      </p>
      <p className="text-xs text-muted-foreground mt-2 italic border-l-2 border-muted-foreground/30 pl-3">
        Example phrasing for teammates: &quot;If discovery sits around 40% of labeled calls, you&apos;re
        often asking for edits before search — paste one grep hit first; it usually cuts hallucination
        rework.&quot;
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CSV parser (fully computes all AUM metrics from logs)
// ---------------------------------------------------------------------------

interface SessionAccum {
  timestamps: number[];
  workingDirs: string[];
  promptCount: number;
  toolCallCount: number;
  readAfterWriteCount: number;
  totalWriteFollowedCount: number;
  lastToolName: string;
}

const TOOL_COLORS: Record<string, string> = {
  Read: "bg-foreground/80",
  Edit: "bg-foreground/55",
  Write: "bg-foreground/35",
  Bash: "bg-foreground/20",
  shell: "bg-foreground/20",
  update_plan: "bg-foreground/15",
  Glob: "bg-foreground/65",
  Grep: "bg-foreground/45",
};

const TOOL_MEANINGS: Record<string, string> = {
  Read: "Exploratory — AI reading your codebase for context",
  Edit: "Targeted changes — surgical, good sign",
  Write: "Code generation — review carefully before committing",
  Bash: "Operational — AI running commands, tests, builds",
  shell: "Operational — AI running shell commands",
  Glob: "File discovery — AI searching your project structure",
  Grep: "Code search — AI scanning for patterns",
};

function parseCSV(text: string): Partial<AUMData> {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return {};

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((l) =>
    Object.fromEntries(l.split(",").map((v, i) => [headers[i], v.trim()]))
  );

  // Global counters (existing logic preserved)
  let totalPrompts = 0;
  const totalSessionsSet = new Set<string>();
  let totalToolCalls = 0;
  const toolCounts: Record<string, number> = {};
  let readAfterWrite = 0;
  let totalWriteFollowed = 0;
  let lastEventType = "";
  let currentSessionPrompts = 0;
  let currentSessionIterations = 0;
  let currentSession = "";
  const iterationsPerSession: number[] = [];

  // Per-session accumulators for stage classification
  const sessionAccum: Record<string, SessionAccum> = {};

  for (const row of rows) {
    const eventType = row["event_type"] ?? "";
    const toolName = row["tool_name"] ?? "";
    const sessionId = row["session_id"] ?? "";
    const workingDir = row["working_dir"] ?? "";
    const ts = row["timestamp"] ? Date.parse(row["timestamp"]) : 0;

    // ── Global iteration tracking (existing logic) ──
    if (sessionId !== currentSession) {
      if (currentSession && currentSessionPrompts > 0) {
        iterationsPerSession.push(currentSessionIterations / currentSessionPrompts);
      }
      currentSession = sessionId;
      currentSessionPrompts = 0;
      currentSessionIterations = 0;
    }
    if (eventType === "user_prompt") { totalPrompts++; currentSessionPrompts++; }
    if (eventType === "tool_call") {
      totalToolCalls++;
      currentSessionIterations++;
      if (toolName) toolCounts[toolName] = (toolCounts[toolName] ?? 0) + 1;
      if (toolName === "Read" && lastEventType === "Write") readAfterWrite++;
      if (lastEventType === "Write") totalWriteFollowed++;
    }
    if (sessionId) totalSessionsSet.add(sessionId);
    if (eventType === "tool_call" || eventType === "tool_result") lastEventType = toolName || eventType;

    // ── Per-session accumulation for stage classification ──
    if (!sessionId) continue;
    if (!sessionAccum[sessionId]) {
      sessionAccum[sessionId] = {
        timestamps: [],
        workingDirs: [],
        promptCount: 0,
        toolCallCount: 0,
        readAfterWriteCount: 0,
        totalWriteFollowedCount: 0,
        lastToolName: "",
      };
    }
    const sa = sessionAccum[sessionId];
    if (ts > 0) sa.timestamps.push(ts);
    if (workingDir) sa.workingDirs.push(workingDir);
    if (eventType === "user_prompt") sa.promptCount++;
    if (eventType === "tool_call") {
      sa.toolCallCount++;
      if (toolName === "Read" && sa.lastToolName === "Write") sa.readAfterWriteCount++;
      if (sa.lastToolName === "Write") sa.totalWriteFollowedCount++;
    }
    if (eventType === "tool_call" || eventType === "tool_result") {
      sa.lastToolName = toolName || sa.lastToolName;
    }
  }

  // Finalise last session
  if (currentSession && currentSessionPrompts > 0) {
    iterationsPerSession.push(currentSessionIterations / currentSessionPrompts);
  }

  // ── Global metrics ──
  const avgIter =
    iterationsPerSession.length > 0
      ? iterationsPerSession.reduce((a, b) => a + b, 0) / iterationsPerSession.length
      : 0;

  const totalTools = Object.values(toolCounts).reduce((a, b) => a + b, 0);
  const toolMix: ToolMix[] = Object.entries(toolCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / totalTools) * 100),
      color: TOOL_COLORS[name] ?? "bg-slate-400",
      meaning: TOOL_MEANINGS[name] ?? "",
    }));

  // ── Session concentration ──
  const allTimestamps = Object.values(sessionAccum).flatMap((sa) => sa.timestamps).filter((t) => t > 0);
  let sessionConcentration = 0;
  let projectStart = 0;
  let projectEnd = 0;

  if (allTimestamps.length > 0) {
    projectStart = Math.min(...allTimestamps);
    projectEnd = Math.max(...allTimestamps);
    const threshold = projectStart + (projectEnd - projectStart) * 0.8;
    const allSessions = Object.values(sessionAccum);
    const lateSessions = allSessions.filter((sa) => {
      if (sa.timestamps.length === 0) return false;
      const sorted = [...sa.timestamps].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      return median > threshold;
    }).length;
    sessionConcentration = allSessions.length > 0
      ? Math.round((lateSessions / allSessions.length) * 100)
      : 0;
  }

  // ── Stage classification ──
  const stageSessionMap: Record<SDLCStage, SessionAccum[]> = {
    Planning: [], Implementation: [], Testing: [], Deployment: [], Maintenance: [],
  };

  for (const sa of Object.values(sessionAccum)) {
    // Find dominant working_dir by frequency
    const dirCounts: Record<string, number> = {};
    for (const d of sa.workingDirs) dirCounts[d] = (dirCounts[d] ?? 0) + 1;
    const dominantDir = Object.entries(dirCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "";

    let stage = classifyStageByPath(dominantDir);
    if (stage === null) {
      // No working_dir — use timestamp position in project timeline
      const avgTs = sa.timestamps.length > 0
        ? sa.timestamps.reduce((a, b) => a + b, 0) / sa.timestamps.length
        : 0;
      stage = avgTs > 0 ? classifyStageByTimestamp(avgTs, projectStart, projectEnd) : "Implementation";
    }
    stageSessionMap[stage].push(sa);
  }

  // ── Per-stage AUM scores ──
  const stageScores: AUMStageScore[] = STAGE_CONFIG.map(({ stage, label, coupled, matureInsight, opportunisticInsight }) => {
    const sessions = stageSessionMap[stage];
    if (sessions.length === 0) {
      return {
        stage, label, aumScore: 0, auSessions: 0,
        iterationsPerPrompt: 0, verificationRatio: 0, coupled,
        noData: true,
        insight: "No AI sessions detected for this stage. Either no work happened here yet, or working_dir paths weren't captured in this CSV.",
      };
    }
    const stagePrompts = sessions.reduce((s, sa) => s + sa.promptCount, 0);
    const stageTools = sessions.reduce((s, sa) => s + sa.toolCallCount, 0);
    const stageRAW = sessions.reduce((s, sa) => s + sa.readAfterWriteCount, 0);
    const stageWF = sessions.reduce((s, sa) => s + sa.totalWriteFollowedCount, 0);

    const avgIterStage = stagePrompts > 0 ? stageTools / stagePrompts : 1.0;
    const avgVerifStage = stageWF > 0 ? stageRAW / stageWF : 0;
    const score = computeAUMScore(avgIterStage, avgVerifStage, sessions.length);

    return {
      stage, label, coupled,
      aumScore: score,
      auSessions: sessions.length,
      iterationsPerPrompt: Math.round(avgIterStage * 10) / 10,
      verificationRatio: Math.round(avgVerifStage * 100) / 100,
      noData: false,
      insight: score >= 55 ? matureInsight : opportunisticInsight,
    };
  });

  return {
    totalPrompts,
    totalSessions: totalSessionsSet.size,
    totalToolCalls,
    avgIterationsPerPrompt: Math.round(avgIter * 10) / 10,
    writeRatio: totalTools > 0 ? Math.round(((toolCounts["Write"] ?? 0) / totalTools) * 100) / 100 : 0,
    sessionConcentration,
    stageScores,
    toolMix,
    isDemoData: false,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function aumColor(score: number) {
  if (score >= 65) return { bar: "bg-green-500", text: "text-green-700 dark:text-green-400", label: "Mature", icon: CheckCircle2 };
  if (score >= 45) return { bar: "bg-yellow-400", text: "text-yellow-700 dark:text-yellow-400", label: "Developing", icon: AlertCircle };
  return { bar: "bg-red-500", text: "text-red-600 dark:text-red-400", label: "Opportunistic", icon: XCircle };
}

function KpiCard({
  label, value, sub, icon: Icon, highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: "good" | "warn" | "bad";
}) {
  const colors = {
    good: "text-green-600 dark:text-green-400",
    warn: "text-yellow-600 dark:text-yellow-400",
    bad: "text-red-600 dark:text-red-400",
    undefined: "text-foreground",
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colors[highlight ?? "undefined"]}`}>{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function AUMStageBar({ stage }: { stage: AUMStageScore }) {
  if (stage.noData) {
    return (
      <div className="rounded-lg border border-dashed p-4 space-y-2 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-muted-foreground">{stage.label}</span>
          <Badge variant="outline" className="text-xs">No data</Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{stage.insight}</p>
      </div>
    );
  }
  const { bar, text, label, icon: Icon } = aumColor(stage.aumScore);
  return (
    <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{stage.label}</span>
          {!stage.coupled && (
            <Badge variant="outline" className="text-xs">
              AU ≠ AUM
            </Badge>
          )}
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label} · {stage.aumScore}/100</span>
      </div>
      <div className="w-full bg-muted/60 rounded-full h-2.5">
        <div className={`${bar} h-2.5 rounded-full transition-all`} style={{ width: `${stage.aumScore}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div><span className="font-medium text-foreground">{stage.auSessions}</span> sessions</div>
        <div><span className="font-medium text-foreground">{stage.iterationsPerPrompt}×</span> avg iterations</div>
        <div><span className="font-medium text-foreground">{Math.round(stage.verificationRatio * 100)}%</span> verification ratio</div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2">
        <Lightbulb className="inline size-3 mr-1 text-muted-foreground" aria-hidden />
        {stage.insight}
      </p>
    </div>
  );
}

function UploadZone({
  onParsed,
}: {
  onParsed: (sessionLogReport: SessionLogReport | null, aumPartial: Partial<AUMData>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const name = file.name.toLowerCase();
      const looksJson =
        name.endsWith(".json") ||
        name.endsWith(".jsonl") ||
        /^\s*[\[{]/.test(text);
      let sessionLogReport: SessionLogReport | null = null;
      let aumPartial: Partial<AUMData>;
      if (looksJson) {
        const result = analyzeSessionLogFile(text);
        sessionLogReport = result.report;
        aumPartial = parseCSV(result.csvText);
      } else {
        aumPartial = parseCSV(text);
      }
      onParsed(sessionLogReport, aumPartial);
    };
    reader.readAsText(file);
  };

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json,.jsonl,text/csv,application/json"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <Upload className="mx-auto size-8 text-muted-foreground mb-3" />
      <p className="font-semibold text-sm mb-1">Upload your AI usage trace</p>
      <p className="text-xs text-muted-foreground max-w-lg mx-auto space-y-1">
        <span className="block">
          <strong>CSV:</strong> run{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            ./ai_usage_stats.py --student you@email.com --filter your-repo-name
          </code>
          {" "}→ <code className="rounded bg-muted px-1 py-0.5 text-xs">ai_usage_trace.csv</code>
        </span>
        <span className="block">
          <strong>JSON / JSONL:</strong> session exports with tool blocks (and optional <code className="rounded bg-muted px-1 py-0.5 text-xs">usage</code>). See {" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs break-all">docs/planning/AI_SESSION_LOG_ANALYZER.md</code>.
        </span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

export function AIMaturityTab() {
  const [data, setData] = useState<AUMData>(DEMO_DATA);
  const [sessionLogReport, setSessionLogReport] = useState<SessionLogReport | null>(
    DEMO_SESSION_LOG_REPORT
  );

  const coachExplain = useCoachExplain();

  const mergeParsed = (
    sessionLog: SessionLogReport | null,
    parsed: Partial<AUMData>,
  ) => {
    setSessionLogReport(sessionLog);
    setData((prev) => ({
      ...prev,
      ...parsed,
      stageScores: parsed.stageScores ?? prev.stageScores,
      isDemoData: false,
    }));
  };

  const scoredStages = data.stageScores.filter((s) => !s.noData);
  const overallAUM = scoredStages.length > 0
    ? Math.round(scoredStages.reduce((s, r) => s + r.aumScore, 0) / scoredStages.length)
    : 0;
  const { label: overallLabel } = aumColor(overallAUM);

  const iterHighlight: "good" | "warn" | "bad" =
    data.avgIterationsPerPrompt <= 3 ? "good" : data.avgIterationsPerPrompt <= 6 ? "warn" : "bad";
  const writeHighlight: "good" | "warn" | "bad" =
    data.writeRatio <= 0.2 ? "good" : data.writeRatio <= 0.35 ? "warn" : "bad";

  return (
    <div className="space-y-8">
      {/* ── Framing header ── */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="default">AUM</Badge>
            <span className="font-semibold">AI Usage Maturity</span>
            <Badge variant="outline" className="text-xs gap-1">
              <BookOpen className="size-3" />
              Research-grounded
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <CoachAiActionButton
              send={coachExplain}
              tooltip="Sends AUM + session analyzer snapshot to Repo Coach for personalized recommendations."
              prompt={buildAiMaturityFullTabCoachPrompt(
                buildAumBriefForCoach(data),
                sessionLogReport,
                data.isDemoData,
              )}
            >
              <Sparkles className="size-4" aria-hidden />
              Ask AI Coach
            </CoachAiActionButton>
            <CoachAiActionButton
              send={coachExplain}
              tooltip="Explains the coach's playbook below in plain language with next steps."
              prompt={buildAiMaturityPlaybookCoachPrompt()}
            >
              <Lightbulb className="size-4" aria-hidden />
              Playbook → AI
            </CoachAiActionButton>
          </div>
        </div>
        <p className="text-sm font-medium">
          Not <em>how much</em> you use AI — but <em>how well</em>.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This dashboard is framed as{" "}
          <span className="font-medium text-foreground">high‑performance coaching</span>, not
          surveillance. It is meant to mirror your habits early — before small AI shortcuts harden into
          technical debt — similar to spotting code smells in review. Metrics here are hypotheses you can
          argue with or improve.
        </p>
        <p className="text-sm text-muted-foreground">
          Based on empirical research across 85 students (SIGCSE 2026). AUM measures four practices:
          iterative prompting, output verification, problem decomposition, and contextual alignment — then
          the session analyzer (when you upload structured logs) adds archetype‑style proxies from real tool traces.
        </p>

        <details className="group rounded-lg border bg-background/60 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-foreground select-none list-none flex items-center gap-2">
            <ChevronRight className="size-4 transition-transform group-open:rotate-90 shrink-0" aria-hidden />
            Coach&apos;s playbook — how to read these five ideas
          </summary>
          <div className="mt-3 space-y-4 text-muted-foreground pl-1 border-l-2 border-primary/30 pl-4">
            <section>
              <h3 className="text-foreground font-semibold text-sm">1. The &quot;Orchestrator&quot; archetype</h3>
              <p className="mt-1">
                <strong className="text-foreground">Pitch:</strong> Are you the pilot or the passenger? This
                is not about coding speed — it is about how well you steer the model. A{" "}
                <strong className="text-foreground">Senior Orchestrator</strong> treats AI like a strong
                intern: context first, check the work, guide the next step. A junior pattern is
                &quot;fix it again&quot; loops until something breaks.
              </p>
              <p className="mt-1 text-xs">
                <strong className="text-foreground">Why it matters:</strong> Good orchestration tracks with
                maintainable changes; pure firefighting tends toward muddy, hard‑to‑review diffs.
              </p>
            </section>
            <section>
              <h3 className="text-foreground font-semibold text-sm">2. Discovery‑to‑action ratio</h3>
              <p className="mt-1">
                <strong className="text-foreground">Pitch:</strong> Look before you leap. We compare
                discovery‑style tool use (search, read, grep, glob) against action tools (edit, write, shell)
                when the log allows. A low share of discovery often means the model is guessing layout.
              </p>
              <p className="mt-1 text-xs">
                <strong className="text-foreground">Why it matters:</strong> Guesses feed hallucinations;
                grounded search first usually matches your architecture.
              </p>
            </section>
            <section>
              <h3 className="text-foreground font-semibold text-sm">3. Stuck score / friction</h3>
              <p className="mt-1">
                <strong className="text-foreground">Pitch:</strong> Don&apos;t fight the machine. Repeated
                similar tool calls or error loops are a signal to pause — split the task, narrow the file, or
                refactor the confusing area so the model (and humans) can reason about it.
              </p>
              <p className="mt-1 text-xs">
                <strong className="text-foreground">Why it matters:</strong> When stuck metrics rise, you are
                often past the point where more retries help without a design change.
              </p>
            </section>
            <section>
              <h3 className="text-foreground font-semibold text-sm">4. Verification frequency</h3>
              <p className="mt-1">
                <strong className="text-foreground">Pitch:</strong> Trust, but verify. We look for test‑like
                shell runs plus read‑after‑write habits next to edits when logs expose them.
              </p>
              <p className="mt-1 text-xs">
                <strong className="text-foreground">Why it matters:</strong> Generating faster than you
                validate is how main‑branch risk creeps in — these metrics reward disciplined check‑in.
              </p>
            </section>
            <section>
              <h3 className="text-foreground font-semibold text-sm">5. Token load &amp; reasoning overhead</h3>
              <p className="mt-1">
                <strong className="text-foreground">Pitch:</strong> Computational efficiency of intent. When
                usage metadata exists, very large input or reasoning deltas vs tiny edits can mean noisy
                prompts or overloaded context — Token ROI vs LOC still needs git enrichment across commits.
              </p>
              <p className="mt-1 text-xs">
                <strong className="text-foreground">Why it matters:</strong> Helps you tighten prompts instead
                of brute‑forcing tokens.
              </p>
            </section>
          </div>
        </details>
      </div>

      {/* ── Demo banner or success banner ── */}
      {data.isDemoData ? (
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Demo data shown.</span>
              <span className="text-muted-foreground ml-1">
                Upload your{" "}
                <code className="rounded bg-muted px-1 text-xs">csv</code>,{" "}
                <code className="rounded bg-muted px-1 text-xs">json</code>, or{" "}
                <code className="rounded bg-muted px-1 text-xs">jsonl</code> trace below — AUM charts plus session analyzer when the file is structured logs.
              </span>
            </div>
          </div>
          <UploadZone onParsed={mergeParsed} />
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 text-muted-foreground" />
            <span className="font-semibold">Your data loaded.</span>
            <span className="text-muted-foreground">
              {data.totalSessions} sessions · {data.totalPrompts} prompts · {data.totalToolCalls} tool calls
            </span>
          </div>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => {
            setSessionLogReport(DEMO_SESSION_LOG_REPORT);
            setData(DEMO_DATA);
          }}>
            Reset to demo
          </Button>
        </div>
      )}

      {sessionLogReport && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="size-4 text-muted-foreground" aria-hidden />
              <h2 className="text-lg font-semibold">Session log analyzer</h2>
              <Badge variant="outline" className="text-xs font-mono">
                v{sessionLogReport.logAnalyzerVersion}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {sessionLogReport.input.sessionCount} session(s) ·{" "}
                {sessionLogReport.input.lineCount} events · {sessionLogReport.input.format}
              </span>
              {data.isDemoData && (
                <Badge variant="secondary" className="text-xs">
                  Sample session report
                </Badge>
              )}
            </div>
            <CoachAiActionButton
              send={coachExplain}
              tooltip="Opens Repo Coach with this session analyzer JSON and asks for sharper coaching bullets."
              prompt={buildAiMaturitySessionCoachPrompt(sessionLogReport)}
            >
              <Sparkles className="size-4" aria-hidden />
              Session → AI
            </CoachAiActionButton>
          </div>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed border-l-2 border-primary/40 pl-3">
            <span className="font-medium text-foreground">Readout + recommendations.</span> The cards and
            percentages below <em>describe</em> what happened in your exported log (tools, tokens, loops,
            verification habits). The{" "}
            <span className="text-foreground font-medium">explanations &amp; recommendations</span> block
            farther down does not stop at definitions — it turns those signals into concrete next steps you
            can try in the next session (same idea as <span className="text-foreground">Coaching Priorities</span>{" "}
            below for AUM).
          </p>
          <SessionCoachTipSnapshot report={sessionLogReport} />
          {sessionLogReport.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/30 px-4 py-2 text-sm text-amber-900 dark:text-amber-200">
              <strong>Parse warnings:</strong>{" "}
              <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
                {sessionLogReport.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 sm:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Archetype</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">{sessionLogReport.archetype}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rule-based label from discovery ratio, verification proxies, and iteration density.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{Math.round(sessionLogReport.scorecard.efficiency * 100)}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Safety / compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{Math.round(sessionLogReport.scorecard.safety_compliance * 100)}%</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Discovery depth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{sessionLogReport.scorecard.discovery_depth}</p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  Tokens
                  {!sessionLogReport.tokens.hasUsageData && (
                    <Badge variant="secondary" className="text-[10px]">Not found in export</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground block text-xs">Input</span>
                  <span className="font-mono">{sessionLogReport.tokens.hasUsageData ? sessionLogReport.tokens.input.toLocaleString() : "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Output</span>
                  <span className="font-mono">{sessionLogReport.tokens.hasUsageData ? sessionLogReport.tokens.output.toLocaleString() : "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-xs">Reasoning (if exported)</span>
                  <span className="font-mono">
                    {sessionLogReport.tokens.reasoning !== null ? sessionLogReport.tokens.reasoning.toLocaleString() : "—"}
                  </span>
                </div>
                {sessionLogReport.tokens.maxInputInSingleRecord != null && sessionLogReport.tokens.hasUsageData && (
                  <div>
                    <span className="text-muted-foreground block text-xs">Max input / turn record</span>
                    <span className="font-mono">{sessionLogReport.tokens.maxInputInSingleRecord.toLocaleString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              label="Discovery ratio"
              value={
                sessionLogReport.metrics.discoveryRatio != null
                  ? `${Math.round(sessionLogReport.metrics.discoveryRatio * 100)}%`
                  : "N/A"
              }
              sub="Discovery vs action taxonomy (tools in log)"
              icon={BarChart3}
            />
            <KpiCard
              label="Test cmds / shell cmds"
              value={
                sessionLogReport.metrics.verificationTestCommandRatio != null
                  ? `${Math.round(sessionLogReport.metrics.verificationTestCommandRatio * 100)}%`
                  : "N/A"
              }
              sub="Shell invocations matched as likely tests"
              icon={Wrench}
            />
            <KpiCard
              label="Read-after-write"
              value={
                sessionLogReport.metrics.readAfterWriteRate != null
                  ? `${Math.round(sessionLogReport.metrics.readAfterWriteRate * 100)}%`
                  : "N/A"
              }
              sub="Reads immediately following Write/Edit (tool-call level)"
              icon={BookOpen}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sessionLogReport.top_patterns.map((p) => (
                  <div key={p.pattern} className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">{p.pattern}</span>
                    <Badge variant={p.status === "Healthy" ? "default" : "secondary"}>
                      {p.frequency} · {p.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Stuck / friction</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  <span className="text-muted-foreground">Loops detected: </span>
                  <span className="font-medium">{sessionLogReport.metrics.stuck.totalLoops}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Avg loop depth: </span>
                  <span className="font-medium">{sessionLogReport.metrics.stuck.averageLoopDepth}</span>
                </p>
                <p className="break-all">
                  <span className="text-muted-foreground">Top friction file: </span>
                  <span className="font-mono">{sessionLogReport.metrics.stuck.topFrictionFile ?? "—"}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="size-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium">Explanations &amp; recommendations</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Each bullet names a finding from your metrics and proposes an action—not a generic definition.
                  For metrics without enough data you may see sparse tips until the export includes usage,
                  fuller tool traces, or (later) git enrichment for ROI-style KPIs.
                </p>
              </div>
            </div>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5 marker:text-foreground">
              {sessionLogReport.ai_coaching_tips.map((t) => (
                <li key={t} className="leading-snug">{t}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-dashed px-4 py-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Enrichment unavailable in-browser (by design)</p>
            <p>Token ROI: {sessionLogReport.metrics.enrichmentUnavailable.tokenRoi}</p>
            <p>Manual intervention: {sessionLogReport.metrics.enrichmentUnavailable.manualIntervention}</p>
            <p>Prompt-to-commit: {sessionLogReport.metrics.enrichmentUnavailable.promptToCommit}</p>
          </div>
        </section>
      )}

      {/* ── Overall AUM score ── */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Your AI Maturity Profile</h2>
          <CoachAiActionButton
            send={coachExplain}
            tooltip="Opens Repo Coach focused on AUM aggregates and SDLC-stage bars."
            prompt={buildAiMaturityAggregateCoachPrompt(buildAumBriefForCoach(data))}
          >
            <Sparkles className="size-4" aria-hidden />
            AUM → AI
          </CoachAiActionButton>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="col-span-full sm:col-span-2 lg:col-span-1 border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="size-4 text-muted-foreground" />
                Overall AUM Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{overallAUM}</div>
              <div className="text-sm text-muted-foreground mt-1">{overallLabel} · out of 100</div>
              <div className="mt-3 w-full bg-muted rounded-full h-2">
                <div className={`${aumColor(overallAUM).bar} h-2 rounded-full`} style={{ width: `${overallAUM}%` }} />
              </div>
            </CardContent>
          </Card>
          <KpiCard
            label="Avg Iterations / Prompt"
            value={data.avgIterationsPerPrompt}
            sub="Lower = clearer prompts. >6 suggests vague asks."
            icon={BarChart3}
          />
          <KpiCard
            label="AI Write Ratio"
            value={`${Math.round(data.writeRatio * 100)}%`}
            sub="Share of AI tool calls that generated new code."
            icon={Wrench}
          />
          <KpiCard
            label="Session Concentration"
            value={`${data.sessionConcentration}%`}
            sub="AI sessions in last 20% of project timeline."
            icon={BarChart3}
          />
        </div>
      </section>

      {/* ── AUM by SDLC stage ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Maturity by SDLC Stage</h2>
          <Badge variant="outline" className="text-xs">
            Research finding: AUM drops sharply at Testing
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          The SIGCSE 2026 paper found a clear two-cluster structure: Planning, Design, and
          Implementation show high AUM (M ≈ 3.8/5); Testing, Deployment, and Maintenance show
          low AUM (M ≈ 3.2/5). The badges below flag stages where usage frequency and maturity
          are decoupled — more AI use doesn't mean better AI use at those stages.
        </p>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.stageScores.map((s) => (
            <AUMStageBar key={s.stage} stage={s} />
          ))}
        </div>
        <details className="mt-4 rounded-lg border p-3 text-xs text-muted-foreground cursor-pointer">
          <summary className="font-medium text-foreground select-none">How stage scores are computed</summary>
          <div className="mt-2 space-y-1 leading-relaxed">
            <p><strong>Iteration score (50%):</strong> max(0, 100 − (avg tool calls per prompt − 1) × 15). Fewer iterations = more precise prompting.</p>
            <p><strong>Verification score (50%):</strong> (Read-after-Write events ÷ Write events) × 100. Higher = better output validation before proceeding.</p>
            <p><strong>Stage assignment:</strong> Each session's most-used working directory is matched against path patterns (e.g. <code>__tests__/</code> → Testing, <code>.github/workflows/</code> → Deployment, <code>src/</code> → Implementation). Sessions with no path fall back to their timestamp position in the project timeline.</p>
          </div>
        </details>
      </section>

      {/* ── Tool mix ── */}
      <section>
        <h2 className="text-lg font-semibold mb-2">How You're Using AI Tools</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The mix of tool types reveals your AI usage <em>mode</em>. Heavy Read = exploratory understanding.
          Heavy Write = code generation (verify before committing). Heavy Edit = targeted, surgical.
          Heavy Bash = operational automation.
        </p>
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex h-5 rounded-full overflow-hidden w-full">
              {data.toolMix.map((t) => (
                <div key={t.name} className={`${t.color} transition-all`} style={{ width: `${t.pct}%` }} title={`${t.name}: ${t.pct}%`} />
              ))}
            </div>
            <div className="space-y-2">
              {data.toolMix.map((t) => (
                <div key={t.name} className="flex items-center gap-3 text-sm">
                  <div className={`size-2.5 rounded-full shrink-0 ${t.color}`} />
                  <span className="font-medium w-16">{t.name}</span>
                  <div className="flex-1 bg-muted rounded-full h-1.5">
                    <div className={`${t.color} h-1.5 rounded-full`} style={{ width: `${t.pct}%` }} />
                  </div>
                  <span className="text-muted-foreground w-12 text-right">{t.pct}%</span>
                  <span className="text-muted-foreground text-xs hidden sm:block">{t.meaning}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Teaching coaching panel ── */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Coaching Priorities</h2>
        <p className="text-sm text-muted-foreground mb-4">
          These recommendations come from the paper's four instructional priorities, applied to your data.
        </p>
        <div className="space-y-3">
          {[
            {
              priority: 1,
              title: "Seed mature habits during Planning",
              finding: "Planning AUM predicts your whole-lifecycle AI behavior (r = 0.80).",
              action: "Before your next sprint: write down the structured goals and constraints you'll give to AI. Don't start a coding session with 'help me build X' — specify the architectural decisions, constraints, and acceptance criteria first.",
              status: (data.stageScores.find((s) => s.stage === "Planning")?.aumScore ?? 0) >= 65
                ? "good" : "warn",
            },
            {
              priority: 2,
              title: "Add structure to Testing AI use",
              finding: "Testing is where AUM collapses for most students — usage is frequent but undisciplined.",
              action: "For every AI-generated test: specify the failure case you're targeting, document why you accepted or rejected the suggestion, and run the suite before committing.",
              status: (data.stageScores.find((s) => s.stage === "Testing")?.aumScore ?? 0) >= 55
                ? "good" : "bad",
            },
            {
              priority: 3,
              title: "Verify before you commit",
              finding: `Your Write ratio is ${Math.round(data.writeRatio * 100)}%. Unreviewed AI-generated code is a leading source of code smells.`,
              action: "After every AI Write: read the generated code, run the linter, and check complexity before staging. One prompt, one review.",
              status: data.writeRatio <= 0.2 ? "good" : data.writeRatio <= 0.35 ? "warn" : "bad",
            },
            {
              priority: 4,
              title: "Spread AI use across the project timeline",
              finding: `${data.sessionConcentration}% of your AI sessions are in the final 20% of the project — a deadline-crunch pattern.`,
              action: "Aim for consistent AI sessions throughout development. Use AI in planning and design, not just when you're stuck at the end.",
              status: data.sessionConcentration <= 30 ? "good" : data.sessionConcentration <= 50 ? "warn" : "bad",
            },
          ].map((item) => {
            return (
              <div key={item.priority} className="rounded-lg border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <ChevronRight className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">Priority {item.priority}</span>
                      <span className="font-semibold text-sm">{item.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.finding}</p>
                    <div className="flex items-start gap-1.5 pt-1">
                      <ChevronRight className="size-3.5 mt-0.5 shrink-0 text-foreground/60" />
                      <p className="text-xs text-foreground/80 leading-relaxed">{item.action}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Research footer ── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 p-4 text-sm">
        <p className="text-blue-900 dark:text-blue-100 font-medium mb-1">Research grounding</p>
        <p className="text-blue-800 dark:text-blue-200 text-xs leading-relaxed">
          AUM is operationalized along four dimensions from the paper: iterative prompting, output verification,
          problem decomposition, and contextual alignment. Stage scores are computed from observable
          tool-log proxies (iterations/prompt, read-after-write ratio, session distribution) rather than
          self-reported surveys, addressing the paper's call for artifact-based validation.
        </p>
        <p className="mt-2 text-blue-700 dark:text-blue-300 text-xs">
          Source: "Stage-Aware AI Usage and AI Usage Maturity in Software Engineering Education" — SIGCSE Virtual 2026
        </p>
      </div>
    </div>
  );
}
