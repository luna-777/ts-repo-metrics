"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Upload,
  Brain,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronRight,
  Lightbulb,
  BarChart3,
  Wrench,
  Sparkles,
  ExternalLink,
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
import { CoachInsightTone } from "@/components/results/coach/CoachInsightTone";
import { cn } from "@/lib/utils";
import { useCoachExplain } from "@/lib/repoCoachContext";
import { buildAiMaturityAggregateCoachPrompt } from "@/lib/aiMaturityExplainPrompts";
import {
  AiUsageSignalLearnMore,
  efficiencyBandHint,
} from "@/components/results/rq/aiUsageSignalHelpContent";
import {
  classifyStageByPath,
  classifyStageByTimestamp,
  computeAUMScore,
  type SDLCStage,
} from "@/lib/aiMaturityCore";

/** Left-accent callouts aligned with other results tabs (e.g. React insights). */
const aiTraceInsightSurface = "bg-card shadow-sm ring-1 ring-border/40";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  stageScores: AUMStageScore[];
  toolMix: ToolMix[];
  isDemoData: boolean;
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
    matureInsight:
      "Strong planning habits detected — grounded prompts here tend to carry through the rest of the workflow.",
    opportunisticInsight:
      "Low verification in planning suggests exploratory AI use without constraints. Add goals and acceptance criteria before coding.",
  },
  {
    stage: "Implementation",
    label: "Implementation",
    coupled: true,
    matureInsight: "Healthy iterative prompting. Watch the Write ratio — unreviewed generated files add review risk.",
    opportunisticInsight:
      "High iterations during implementation often mean prompts are too broad. Break work into smaller, specified asks.",
  },
  {
    stage: "Testing",
    label: "Testing",
    coupled: false,
    matureInsight: "Disciplined AI use in testing — keep specifying failure cases and running checks before commit.",
    opportunisticInsight:
      "High iterations suggest vague test prompts. Name the behavior under test and the failure you expect.",
  },
  {
    stage: "Deployment",
    label: "Deployment",
    coupled: false,
    matureInsight: "Good verification of AI-suggested config changes — this stage is easy to rush.",
    opportunisticInsight:
      "Low verification ratio means AI-suggested config changes may not be validated before use — dry-run or review in staging.",
  },
  {
    stage: "Maintenance",
    label: "Maintenance",
    coupled: false,
    matureInsight:
      "Structured AI use in maintenance — chores often slip into copy-paste mode under deadlines; you are avoiding that pattern.",
    opportunisticInsight:
      "Usage looks opportunistic — add a quick check (read-back, lint, small test) after AI edits in configs and scripts.",
  },
];

// ---------------------------------------------------------------------------
// Demo sample trace (illustrates mixed stage scores)
// ---------------------------------------------------------------------------

const DEMO_DATA: AUMData = {
  totalPrompts: 142,
  totalSessions: 18,
  totalToolCalls: 874,
  avgIterationsPerPrompt: 4.3,
  writeRatio: 0.31,
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

function buildAiUsageProfileBrief(
  data: AUMData,
  sessionLogReport: SessionLogReport | null,
): Record<string, unknown> {
  return {
    totalPrompts: data.totalPrompts,
    totalSessions: data.totalSessions,
    totalToolCalls: data.totalToolCalls,
    avgIterationsPerPrompt: data.avgIterationsPerPrompt,
    writeRatio: data.writeRatio,
    isDemoData: data.isDemoData,
    stages: data.stageScores.map((s) => ({
      stage: s.stage,
      stageScore: s.aumScore,
      sessionsInStage: s.auSessions,
      iterationsPerPrompt: s.iterationsPerPrompt,
      verificationRatio: s.verificationRatio,
      noData: !!s.noData,
    })),
    toolMix: data.toolMix.map((t) => ({ name: t.name, pct: t.pct, count: t.count })),
    sessionLog: sessionLogReport
      ? {
          scorecard: {
            efficiency: sessionLogReport.scorecard.efficiency,
            efficiencyBreakdown: sessionLogReport.scorecard.efficiencyBreakdown,
            safety_compliance: sessionLogReport.scorecard.safety_compliance,
            discovery_depth: sessionLogReport.scorecard.discovery_depth,
          },
          metrics: {
            discoveryRatio: sessionLogReport.metrics.discoveryRatio,
            readAfterWriteRate: sessionLogReport.metrics.readAfterWriteRate,
            blindEditRate: sessionLogReport.metrics.blindEditRate,
            verificationTestCommandRatio: sessionLogReport.metrics.verificationTestCommandRatio,
          },
        }
      : null,
  };
}

/** Opens Repo Coach with a dynamic prompt — same UX idea as CoachExplainButton on Testing. */
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

function SessionLogSummaryInsight({ report }: { report: SessionLogReport }) {
  const dr = report.metrics.discoveryRatio;
  const shellTest = report.metrics.verificationTestCommandRatio;
  const loops = report.metrics.stuck.totalLoops;
  const discoveryPct = dr != null ? Math.round(dr * 100) : null;
  const shellPct = shellTest != null ? Math.round(shellTest * 100) : null;

  return (
    <CoachInsightTone
      tone="informational"
      title="What this log suggests"
      className={aiTraceInsightSurface}
      bodyClassName="text-foreground/90 font-normal space-y-3"
      aria-label="Summary from session log metrics"
    >
      <p>
        {discoveryPct != null ? (
          <>
            Discovery-style calls are about <strong className="text-foreground">{discoveryPct}%</strong> of
            labeled discovery-and-action tool calls.{" "}
            {discoveryPct <= 18
              ? "That leans write-heavy — try a targeted read or search before large edits."
              : "That suggests you often ground the assistant before big changes."}{" "}
          </>
        ) : null}
        {shellPct != null ? (
          <>
            Shell calls classified as test-like are about{" "}
            <strong className="text-foreground">{shellPct}%</strong> of shell tool invocations.{" "}
          </>
        ) : null}
        {loops >= 2 ? (
          <>
            Repeated similar tool calls flagged <strong className="text-foreground">{loops}</strong> loop(s)
            — pause, shrink the task, or simplify the hot path before retrying.
          </>
        ) : (
          <>Few repeated-call loops in this run — still watch the friction file if errors cluster.</>
        )}
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Talking it through with a teammate? Try grounding edits with one concrete search or file reference
        before asking for a large change — it usually reduces rework.
      </p>
    </CoachInsightTone>
  );
}

// ---------------------------------------------------------------------------
// CSV trace parser (aggregates tool stream into profile metrics)
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

/**
 * RFC 4180-compliant CSV parser.
 *
 * Handles:
 *   - Double-quoted fields (outer quotes stripped)
 *   - Commas inside quoted fields (not treated as delimiters)
 *   - Newlines inside quoted fields (kept verbatim; parser advances past them)
 *   - Doubled double-quotes ("") as an escaped quote character inside a field
 *   - Unquoted fields (leading/trailing whitespace trimmed)
 */
function parseCSVText(text: string): Record<string, string>[] {
  const results: Record<string, string>[] = [];
  let pos = 0;
  const len = text.length;

  function parseField(): string {
    if (pos < len && text[pos] === '"') {
      // Quoted field
      pos++; // skip opening quote
      let value = "";
      while (pos < len) {
        if (text[pos] === '"') {
          if (pos + 1 < len && text[pos + 1] === '"') {
            // Escaped double-quote
            value += '"';
            pos += 2;
          } else {
            // Closing quote
            pos++;
            break;
          }
        } else {
          value += text[pos];
          pos++;
        }
      }
      return value;
    } else {
      // Unquoted field — read until comma or newline
      const start = pos;
      while (pos < len && text[pos] !== "," && text[pos] !== "\n" && text[pos] !== "\r") {
        pos++;
      }
      return text.slice(start, pos).trim();
    }
  }

  function parseRow(): string[] | null {
    if (pos >= len) return null;
    // Skip a leading \r\n or \n that ended the previous row
    if (text[pos] === "\r") pos++;
    if (pos < len && text[pos] === "\n") pos++;
    if (pos >= len) return null;

    const fields: string[] = [];
    while (true) {
      fields.push(parseField());
      if (pos >= len || text[pos] === "\n" || text[pos] === "\r") break;
      if (text[pos] === ",") { pos++; continue; }
      break;
    }
    return fields;
  }

  // Parse header row
  const headerRow = parseRow();
  if (!headerRow) return results;
  const headers = headerRow;

  // Parse data rows
  while (pos < len) {
    const row = parseRow();
    if (!row) break;
    // Skip entirely blank rows (single empty field)
    if (row.length === 1 && row[0] === "") continue;
    const obj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = row[i] ?? "";
    }
    results.push(obj);
  }

  return results;
}

function parseCSV(text: string): Partial<AUMData> {
  const rows = parseCSVText(text);
  if (rows.length === 0) return {};

  // Global counters (existing logic preserved)
  let totalPrompts = 0;
  const totalSessionsSet = new Set<string>();
  let totalToolCalls = 0;
  const toolCounts: Record<string, number> = {};
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
    }
    if (sessionId) totalSessionsSet.add(sessionId);

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

  // ── Project timeline bounds (for stage fallback when working_dir is missing) ──
  const allTimestamps = Object.values(sessionAccum).flatMap((sa) => sa.timestamps).filter((t) => t > 0);
  let projectStart = 0;
  let projectEnd = 0;
  if (allTimestamps.length > 0) {
    projectStart = Math.min(...allTimestamps);
    projectEnd = Math.max(...allTimestamps);
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

  // ── Per-stage scores ──
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
    writeRatio: totalTools > 0
      ? Math.round(
          (((toolCounts["Write"] ?? 0) + (toolCounts["Edit"] ?? 0) + (toolCounts["MultiEdit"] ?? 0) + (toolCounts["ApplyPatch"] ?? 0)) / totalTools) * 100
        ) / 100
      : 0,
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
      <CoachInsightTone
        tone="informational"
        title={stage.label}
        className={aiTraceInsightSurface}
        bodyClassName="text-foreground/90 font-normal space-y-2 text-sm"
      >
        <Badge variant="outline" className="text-xs w-fit">
          No data
        </Badge>
        <p className="text-muted-foreground leading-relaxed text-xs">{stage.insight}</p>
      </CoachInsightTone>
    );
  }
  const { bar, label, icon: Icon } = aumColor(stage.aumScore);
  return (
    <CoachInsightTone
      tone="informational"
      title={stage.label}
      className={aiTraceInsightSurface}
      bodyClassName="text-foreground/90 font-normal space-y-3 text-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <Icon className="size-4 text-muted-foreground shrink-0" aria-hidden />
        <span className="text-sm font-medium text-muted-foreground tabular-nums">
          {label} · {stage.aumScore}/100
        </span>
      </div>
      <div className="w-full bg-muted/60 rounded-full h-2.5">
        <div className={`${bar} h-2.5 rounded-full transition-all`} style={{ width: `${stage.aumScore}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>
          <span className="font-semibold text-foreground">{stage.auSessions}</span> sessions
        </div>
        <div>
          <span className="font-semibold text-foreground">{stage.iterationsPerPrompt}×</span> avg iterations
        </div>
        <div>
          <span className="font-semibold text-foreground">{Math.round(stage.verificationRatio * 100)}%</span>{" "}
          verification ratio
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2">
        <Lightbulb className="inline size-3 mr-1 text-muted-foreground" aria-hidden />
        {stage.insight}
      </p>
    </CoachInsightTone>
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

const AGENT_STATS_REPO_URL = "https://github.com/masc-ucsc/agent_stats";

function AgentStatsExportInsight() {
  return (
    <div className="space-y-3">
      <CoachInsightTone
        tone="informational"
        title="Get a CSV from your AI coding logs"
        className={aiTraceInsightSurface}
        bodyClassName="text-foreground/90 font-normal space-y-3 text-sm leading-relaxed"
        aria-label="How to export AI coding logs with agent_stats"
      >
        <p className="flex flex-wrap items-center gap-2">
          <Wrench className="size-4 text-muted-foreground shrink-0" aria-hidden />
          <Badge variant="outline" className="text-xs font-normal">
            Optional · runs on your laptop
          </Badge>
        </p>
        <p className="text-muted-foreground">
          This tab charts tool traces from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">ai_usage_trace.csv</code>. The{" "}
          <a
            href={AGENT_STATS_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            masc-ucsc/agent_stats
          </a>{" "}
          repo (public) scans local Claude Code, Codex CLI, and Gemini CLI session logs — nothing is uploaded from that
          step until you choose a file here.
        </p>
        <ol className="list-decimal space-y-2 pl-5 marker:text-foreground/80 text-muted-foreground">
          <li>
            Clone the repository (Code → HTTPS or SSH on GitHub), then open a terminal in that folder.
          </li>
          <li>
            Run{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs break-all text-foreground">
              ./ai_usage_stats.py --student your@email.edu --filter your-repo-slug
            </code>
            . Use <code className="rounded bg-muted px-1 text-xs text-foreground">--filter</code> with a substring or regex
            that matches <strong className="text-foreground">this course project</strong> so other folders are excluded (see
            the repo README).
          </li>
          <li>
            By default the script writes{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">ai_usage_trace.csv</code> — drag it into
            the upload zone below (or use{" "}
            <code className="rounded bg-muted px-1 text-xs text-foreground">--csv path/to/file.csv</code> if you prefer another
            path).
          </li>
        </ol>
      </CoachInsightTone>
      <Button asChild variant="secondary" size="sm" className="gap-2">
        <a href={AGENT_STATS_REPO_URL} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-4 shrink-0" aria-hidden />
          Open agent_stats on GitHub
        </a>
      </Button>
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

  const sessionLogEfficiencyHint = sessionLogReport
    ? efficiencyBandHint(Math.round(sessionLogReport.scorecard.efficiency * 100))
    : null;

  return (
    <div className="space-y-8">
      <AgentStatsExportInsight />

      {/* ── Demo banner or success banner ── */}
      {data.isDemoData ? (
        <div className="space-y-4">
          <CoachInsightTone
            tone="informational"
            title="Demo data shown"
            className={aiTraceInsightSurface}
            bodyClassName="text-foreground/90 font-normal text-sm"
          >
            <p className="flex flex-wrap items-center gap-2">
              <AlertCircle className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <span>
                Upload your{" "}
                <code className="rounded bg-muted px-1 text-xs">csv</code>,{" "}
                <code className="rounded bg-muted px-1 text-xs">json</code>, or{" "}
                <code className="rounded bg-muted px-1 text-xs">jsonl</code> trace below — stage charts plus session
                analyzer when the file is structured logs.
              </span>
            </p>
          </CoachInsightTone>
          <UploadZone onParsed={mergeParsed} />
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CoachInsightTone
            tone="positive"
            title="Your data loaded"
            className={cn("min-w-0 flex-1", aiTraceInsightSurface)}
            bodyClassName="text-foreground/90 font-normal text-sm"
          >
            <p className="flex flex-wrap items-center gap-2">
              <CheckCircle2 className="size-4 text-muted-foreground shrink-0" aria-hidden />
              <span className="text-muted-foreground">
                {data.totalSessions} sessions · {data.totalPrompts} prompts · {data.totalToolCalls} tool calls
              </span>
            </p>
          </CoachInsightTone>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs shrink-0"
            onClick={() => {
              setSessionLogReport(DEMO_SESSION_LOG_REPORT);
              setData(DEMO_DATA);
            }}
          >
            Reset to demo
          </Button>
        </div>
      )}

      {sessionLogReport && (
        <section className="space-y-4">
          <SessionLogSummaryInsight report={sessionLogReport} />
          {sessionLogReport.warnings.length > 0 ? (
            <CoachInsightTone
              tone="concern"
              title="Parse warnings"
              className={aiTraceInsightSurface}
              bodyClassName="text-foreground/90 font-normal text-sm"
            >
              <ul className="list-disc pl-5 text-xs space-y-0.5 marker:text-foreground">
                {sessionLogReport.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </CoachInsightTone>
          ) : null}
          <h2 className="text-lg font-semibold">Core signals</h2>
          {!sessionLogReport.tokens.hasUsageData ? (
            <Badge variant="secondary" className="text-[10px] w-fit">
              Token usage not found in export
            </Badge>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">Input tokens</CardTitle>
                  <AiUsageSignalLearnMore signalId="token-input" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {sessionLogReport.tokens.hasUsageData ? sessionLogReport.tokens.input.toLocaleString() : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">Output tokens</CardTitle>
                  <AiUsageSignalLearnMore signalId="token-output" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {sessionLogReport.tokens.hasUsageData ? sessionLogReport.tokens.output.toLocaleString() : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">Reasoning tokens</CardTitle>
                  <AiUsageSignalLearnMore signalId="token-reasoning" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-1">When exported by your agent</p>
                <p className="font-mono text-lg font-semibold tabular-nums">
                  {sessionLogReport.tokens.reasoning !== null ? sessionLogReport.tokens.reasoning.toLocaleString() : "—"}
                </p>
              </CardContent>
            </Card>
            {sessionLogReport.tokens.maxInputInSingleRecord != null && sessionLogReport.tokens.hasUsageData ? (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm">Peak input tokens</CardTitle>
                    <AiUsageSignalLearnMore signalId="token-peak" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-1">Single turn / record</p>
                  <p className="font-mono text-lg font-semibold tabular-nums">
                    {sessionLogReport.tokens.maxInputInSingleRecord.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <h2 className="text-lg font-semibold">Other signals</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">Efficiency</CardTitle>
                  <AiUsageSignalLearnMore signalId="efficiency" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-3">
                <p className="text-2xl font-bold">{Math.round(sessionLogReport.scorecard.efficiency * 100)}%</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  How focused each prompt is and how much exploration appears in the tool stream.
                </p>
                {sessionLogEfficiencyHint?.text ? (
                  <p className={`text-sm font-medium ${sessionLogEfficiencyHint.className}`}>
                    {sessionLogEfficiencyHint.text}
                  </p>
                ) : null}
              </CardContent>
            </Card>
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">Safety / compliance</CardTitle>
                  <AiUsageSignalLearnMore signalId="safety-compliance" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-3">
                <p className="text-2xl font-bold">{Math.round(sessionLogReport.scorecard.safety_compliance * 100)}%</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Combines verification-style habits (read-back after edits and/or test-like shell commands) with
                  blind-edit pressure—not a security audit.
                </p>
              </CardContent>
            </Card>
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm">Discovery ratio</CardTitle>
                  <AiUsageSignalLearnMore signalId="discovery-ratio" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-3">
                <p className="text-2xl font-bold tabular-nums">
                  {sessionLogReport.metrics.discoveryRatio != null
                    ? `${Math.round(sessionLogReport.metrics.discoveryRatio * 100)}%`
                    : "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Discovery depth:{" "}
                  <span className="font-medium text-foreground">
                    {sessionLogReport.scorecard.discovery_depth.toLowerCase()}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Tool-call mix: exploratory vs action tools in this log.{" "}
                  <strong className="text-foreground">Efficiency</strong> also weights exploration via its discovery
                  component. Bands: High ≥38%, Medium 18–38%, Low ≤18%.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ── Overall profile from trace ── */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Profile from your trace</h2>
          <CoachAiActionButton
            send={coachExplain}
            tooltip="Send aggregate scores and stage breakdown to Repo Coach."
            prompt={buildAiMaturityAggregateCoachPrompt(buildAiUsageProfileBrief(data, sessionLogReport))}
          >
            <Sparkles className="size-4" aria-hidden />
            Ask Coach
          </CoachAiActionButton>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CoachInsightTone
            tone="informational"
            title="Overall score"
            className={cn("col-span-full sm:col-span-2 lg:col-span-1", aiTraceInsightSurface)}
            bodyClassName="space-y-3 text-foreground/90 font-normal"
          >
            <Brain className="size-4 text-muted-foreground" aria-hidden />
            <div className="text-4xl font-bold tabular-nums">{overallAUM}</div>
            <div className="text-sm text-muted-foreground">{overallLabel} · out of 100</div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div className={`${aumColor(overallAUM).bar} h-2 rounded-full`} style={{ width: `${overallAUM}%` }} />
            </div>
          </CoachInsightTone>
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
        </div>
      </section>

      {/* ── By SDLC stage ── */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold">By project phase</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl leading-relaxed">
          Sessions are grouped by working-directory patterns (tests, CI, docs, app code, etc.). Each callout blends how
          many tool turns happen per prompt with read-after-write style checks — higher scores usually mean clearer
          prompts and more validation before moving on.
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
            <p><strong>Stage assignment:</strong> Each session&apos;s most-used working directory is matched against path patterns (e.g. <code>__tests__/</code> → Testing, <code>.github/workflows/</code> → Deployment, <code>src/</code> → Implementation). Sessions with no path fall back to their timestamp position in the project timeline.</p>
          </div>
        </details>
      </section>

      {/* ── Tool mix ── */}
      <section>
        <CoachInsightTone
          tone="informational"
          title="How you&apos;re using AI tools"
          className={aiTraceInsightSurface}
          bodyClassName="text-foreground/90 font-normal space-y-4 text-sm"
        >
          <p className="text-muted-foreground leading-relaxed">
            The mix of tool types reveals your AI usage <em>mode</em>. Heavy Read = exploratory understanding. Heavy
            Write = code generation (verify before committing). Heavy Edit = targeted, surgical. Heavy Bash =
            operational automation.
          </p>
          <div className="flex h-5 rounded-full overflow-hidden w-full">
            {data.toolMix.map((t) => (
              <div
                key={t.name}
                className={`${t.color} transition-all`}
                style={{ width: `${t.pct}%` }}
                title={`${t.name}: ${t.pct}%`}
              />
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
                <span className="text-muted-foreground w-12 text-right tabular-nums">{t.pct}%</span>
                <span className="text-muted-foreground text-xs hidden sm:block">{t.meaning}</span>
              </div>
            ))}
          </div>
        </CoachInsightTone>
      </section>

      {/* ── Coaching priorities ── */}
      <section>
        <h2 className="text-lg font-semibold mb-2">What to try next</h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Practical checks derived from your trace — adjust or ignore what does not fit your team&apos;s norms.
        </p>
        <div className="space-y-3">
          {[
            {
              priority: 1,
              title: "Lock scope before coding",
              finding:
                "Planning-stage habits tend to carry through the rest of a session — vague goals here show up as churn later.",
              action:
                "Before the next coding block: write constraints, acceptance criteria, and files in scope. Avoid opening with only \"build X\".",
            },
            {
              priority: 2,
              title: "Structure testing-assistant turns",
              finding:
                "Testing often shows higher iteration counts — usually from underspecified failure cases or skipping the suite.",
              action:
                "For each AI-suggested test: name the failure mode, accept or reject with a one-line reason, and run tests before commit.",
            },
            {
              priority: 3,
              title: "Verify before you commit",
              finding: `Your Write ratio is ${Math.round(data.writeRatio * 100)}%. Large Write shares deserve a quick read-back and lint.`,
              action:
                "After substantive Write/Edit bursts: skim the diff, run the linter, and run targeted tests before staging.",
            },
          ].map((item) => (
              <CoachInsightTone
                key={item.priority}
                tone="informational"
                title={`Priority ${item.priority}: ${item.title}`}
                className={aiTraceInsightSurface}
                bodyClassName="text-foreground/90 font-normal space-y-2 text-sm"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">{item.finding}</p>
                <div className="flex items-start gap-2 pt-0.5">
                  <ChevronRight className="size-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
                  <p className="text-xs leading-relaxed">{item.action}</p>
                </div>
              </CoachInsightTone>
            ))}
        </div>
      </section>
    </div>
  );
}
