"use client";

import { useRef, useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

function UploadZone({ onUpload }: { onUpload: (data: Partial<AUMData>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onUpload(parseCSV(text));
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
        accept=".csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <Upload className="mx-auto size-8 text-muted-foreground mb-3" />
      <p className="font-semibold text-sm mb-1">Upload your AI usage trace</p>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        Run{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">
          ./ai_usage_stats.py --student you@email.com --filter your-repo-name
        </code>{" "}
        then drag the <code className="rounded bg-muted px-1 py-0.5 text-xs">ai_usage_trace.csv</code> here.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------

export function AIMaturityTab() {
  const [data, setData] = useState<AUMData>(DEMO_DATA);

  const handleUpload = (parsed: Partial<AUMData>) => {
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
      <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="default">AUM</Badge>
          <span className="font-semibold">AI Usage Maturity</span>
          <Badge variant="outline" className="text-xs gap-1">
            <BookOpen className="size-3" />
            Research-grounded
          </Badge>
        </div>
        <p className="text-sm font-medium">
          Not <em>how much</em> you use AI — but <em>how well</em>.
        </p>
        <p className="text-sm text-muted-foreground">
          Based on empirical research across 85 students (SIGCSE 2026). AUM measures four
          practices: iterative prompting, output verification, problem decomposition, and
          contextual alignment. Students who use AI frequently but without these practices
          score high on AU and low on AUM — and their code quality suffers for it.
        </p>
      </div>

      {/* ── Demo banner or success banner ── */}
      {data.isDemoData ? (
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="size-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Demo data shown.</span>
              <span className="text-muted-foreground ml-1">
                Upload your <code className="rounded bg-muted px-1 text-xs">ai_usage_trace.csv</code> below to see your actual AI usage maturity.
              </span>
            </div>
          </div>
          <UploadZone onUpload={handleUpload} />
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
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setData(DEMO_DATA)}>
            Reset to demo
          </Button>
        </div>
      )}

      {/* ── Overall AUM score ── */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Your AI Maturity Profile</h2>
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
