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
  BarChart3,
  Wrench,
  Sparkles,
  ExternalLink,
  Calendar,
  Activity,
  Zap,
  MessageSquare,
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
import { computeAUMScore } from "@/lib/aiMaturityCore";

const aiTraceInsightSurface = "bg-card shadow-sm ring-1 ring-border/40";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  globalVerificationRatio: number;
  toolMix: ToolMix[];
  isDemoData: boolean;
  // Active days heatmap
  activeDays: { date: string; promptCount: number }[];
  uniqueDays: number;
  avgPromptsPerDay: number;
  busiestDay: string | null;
  // Session depth
  avgSessionLengthTools: number;
  // Token efficiency (conditional — requires --tokens flag)
  hasTokenData: boolean;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  totalCacheReadTokens?: number;
  totalCacheCreationTokens?: number;
  cacheHitRate?: number;
  // Prompt quality (conditional — requires --messages flag)
  hasMessageData: boolean;
  avgPromptLength?: number;
}

// ---------------------------------------------------------------------------
// Demo data
// ---------------------------------------------------------------------------

const DEMO_DATA: AUMData = {
  totalPrompts: 142,
  totalSessions: 18,
  totalToolCalls: 874,
  avgIterationsPerPrompt: 4.3,
  writeRatio: 0.31,
  globalVerificationRatio: 0.58,
  isDemoData: true,
  activeDays: [
    { date: "2026-04-28", promptCount: 5 },
    { date: "2026-04-29", promptCount: 3 },
    { date: "2026-04-30", promptCount: 7 },
    { date: "2026-05-01", promptCount: 4 },
    { date: "2026-05-05", promptCount: 6 },
    { date: "2026-05-06", promptCount: 8 },
    { date: "2026-05-07", promptCount: 3 },
    { date: "2026-05-08", promptCount: 5 },
    { date: "2026-05-12", promptCount: 9 },
    { date: "2026-05-13", promptCount: 6 },
    { date: "2026-05-14", promptCount: 11 },
    { date: "2026-05-15", promptCount: 15 },
    { date: "2026-05-16", promptCount: 7 },
    { date: "2026-05-19", promptCount: 8 },
    { date: "2026-05-20", promptCount: 5 },
    { date: "2026-05-21", promptCount: 9 },
    { date: "2026-05-22", promptCount: 4 },
    { date: "2026-05-23", promptCount: 6 },
  ],
  uniqueDays: 18,
  avgPromptsPerDay: 7.9,
  busiestDay: "2026-05-15",
  avgSessionLengthTools: 48.6,
  hasTokenData: false,
  hasMessageData: false,
  toolMix: [
    { name: "Read", count: 312, pct: 36, color: "bg-foreground/80", meaning: "Exploratory — AI reading your codebase for context" },
    { name: "Edit", count: 254, pct: 29, color: "bg-foreground/55", meaning: "Targeted changes — surgical, good sign" },
    { name: "Write", count: 201, pct: 23, color: "bg-foreground/35", meaning: "Code generation — review carefully before committing" },
    { name: "Bash", count: 107, pct: 12, color: "bg-foreground/20", meaning: "Operational — AI running commands, tests, builds" },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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
    globalVerificationRatio: data.globalVerificationRatio,
    uniqueDays: data.uniqueDays,
    avgPromptsPerDay: data.avgPromptsPerDay,
    avgSessionLengthTools: data.avgSessionLengthTools,
    isDemoData: data.isDemoData,
    toolMix: data.toolMix.map((t) => ({ name: t.name, pct: t.pct, count: t.count })),
    tokens: data.hasTokenData
      ? { totalInputTokens: data.totalInputTokens, totalOutputTokens: data.totalOutputTokens, cacheHitRate: data.cacheHitRate }
      : null,
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

// ---------------------------------------------------------------------------
// Heatmap helpers
// ---------------------------------------------------------------------------

const WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;
const WEEKDAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const MAX_HEATMAP_WEEKS = 26;

function buildAiActivityGrid(activeDays: { date: string; promptCount: number }[]) {
  if (activeDays.length === 0) return null;

  const dateMap = new Map<string, number>();
  for (const d of activeDays) dateMap.set(d.date, d.promptCount);

  const sorted = [...activeDays].sort((a, b) => a.date.localeCompare(b.date));
  const minDate = sorted[0]!.date;
  const maxDate = sorted[sorted.length - 1]!.date;

  const minDateObj = new Date(minDate + "T00:00:00Z");
  const maxDateObj = new Date(maxDate + "T00:00:00Z");

  // Mon-first (JS Sun=0 → Mon=0 via (day+6)%7)
  const minDow = (minDateObj.getUTCDay() + 6) % 7;
  const startMonday = new Date(minDateObj);
  startMonday.setUTCDate(minDateObj.getUTCDate() - minDow);

  const maxDow = (maxDateObj.getUTCDay() + 6) % 7;
  const endSunday = new Date(maxDateObj);
  endSunday.setUTCDate(maxDateObj.getUTCDate() + (6 - maxDow));

  const totalWeeks = Math.round((endSunday.getTime() - startMonday.getTime()) / (7 * 86400000)) + 1;
  const weeks = Math.min(totalWeeks, MAX_HEATMAP_WEEKS);

  // If capped, re-anchor to (weeks) weeks back from endSunday
  const actualStart = new Date(endSunday);
  actualStart.setUTCDate(endSunday.getUTCDate() - (weeks - 1) * 7);
  const actualStartDow = (actualStart.getUTCDay() + 6) % 7;
  actualStart.setUTCDate(actualStart.getUTCDate() - actualStartDow);

  const grid: number[][] = Array.from({ length: 7 }, () => new Array(weeks).fill(0) as number[]);
  const columnWeekStarts: string[] = [];

  for (let w = 0; w < weeks; w++) {
    const weekMonday = new Date(actualStart);
    weekMonday.setUTCDate(actualStart.getUTCDate() + w * 7);
    columnWeekStarts.push(weekMonday.toISOString().slice(0, 10));
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekMonday);
      day.setUTCDate(weekMonday.getUTCDate() + d);
      grid[d]![w] = dateMap.get(day.toISOString().slice(0, 10)) ?? 0;
    }
  }

  let maxCount = 0;
  for (const row of grid) for (const c of row) if (c > maxCount) maxCount = c;

  return { grid, columnWeekStarts, maxCount };
}

function heatClass(count: number, max: number): string {
  if (max <= 0 || count <= 0) return "bg-muted/60 border border-border/50";
  const r = count / max;
  if (r < 0.2) return "border border-green-900/40 bg-green-950/50";
  if (r < 0.4) return "border border-green-800/50 bg-green-800/50";
  if (r < 0.6) return "border border-green-600/60 bg-green-600/70";
  if (r < 0.85) return "border border-emerald-500/70 bg-emerald-500/80";
  return "border border-emerald-400 bg-emerald-400/90";
}

function getMonthLabels(columnWeekStarts: string[]): (string | null)[] {
  let prev = -1;
  return columnWeekStarts.map((iso) => {
    const m = parseInt(iso.slice(5, 7), 10) - 1;
    if (m !== prev) { prev = m; return MONTH_SHORT[m] ?? ""; }
    return null;
  });
}

const HEATMAP_GAP = "gap-0.5 sm:gap-1";
const HEATMAP_CELL = "size-4 shrink-0 rounded-[3px] sm:size-5";
const HEATMAP_LABEL_COL = "w-5 shrink-0 text-right text-[10px] text-muted-foreground sm:w-6 sm:text-xs";

// ---------------------------------------------------------------------------
// Coach action button
// ---------------------------------------------------------------------------

function CoachAiActionButton({
  prompt, send, children, tooltip,
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

// ---------------------------------------------------------------------------
// Session log summary insight
// ---------------------------------------------------------------------------

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
        Try grounding edits with one concrete search or file reference before asking for a large change — it
        usually reduces rework.
      </p>
    </CoachInsightTone>
  );
}

// ---------------------------------------------------------------------------
// CSV trace parser
// ---------------------------------------------------------------------------

interface SessionAccum {
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
 * Handles quoted fields, embedded commas/newlines, and doubled double-quotes.
 */
function parseCSVText(text: string): Record<string, string>[] {
  const results: Record<string, string>[] = [];
  let pos = 0;
  const len = text.length;

  function parseField(): string {
    if (pos < len && text[pos] === '"') {
      pos++;
      let value = "";
      while (pos < len) {
        if (text[pos] === '"') {
          if (pos + 1 < len && text[pos + 1] === '"') {
            value += '"';
            pos += 2;
          } else {
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
      const start = pos;
      while (pos < len && text[pos] !== "," && text[pos] !== "\n" && text[pos] !== "\r") pos++;
      return text.slice(start, pos).trim();
    }
  }

  function parseRow(): string[] | null {
    if (pos >= len) return null;
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

  const headerRow = parseRow();
  if (!headerRow) return results;
  const headers = headerRow;

  while (pos < len) {
    const row = parseRow();
    if (!row) break;
    if (row.length === 1 && row[0] === "") continue;
    const obj: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) obj[headers[i]!] = row[i] ?? "";
    results.push(obj);
  }
  return results;
}

function parseCSV(text: string): Partial<AUMData> {
  const rows = parseCSVText(text);
  if (rows.length === 0) return {};

  // Detect optional columns
  const firstRow = rows[0] ?? {};
  const hasTokenCols = "input_tokens" in firstRow;
  const hasMessageCol = "message_text" in firstRow;

  // Global counters
  let totalPrompts = 0;
  const totalSessionsSet = new Set<string>();
  let totalToolCalls = 0;
  const toolCounts: Record<string, number> = {};

  // Iteration tracking
  let currentSession = "";
  let currentSessionPrompts = 0;
  let currentSessionIterations = 0;
  const iterationsPerSession: number[] = [];

  // Active days
  const dayPromptMap = new Map<string, number>();

  // Per-session accumulators (for verification ratio)
  const sessionAccum: Record<string, SessionAccum> = {};

  // Token accumulators
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheReadTokens = 0;
  let totalCacheCreationTokens = 0;
  let hasAnyTokenData = false;

  // Prompt length
  let totalPromptLength = 0;
  let promptsWithText = 0;

  for (const row of rows) {
    const eventType = row["event_type"] ?? "";
    const toolName = row["tool_name"] ?? "";
    const sessionId = row["session_id"] ?? "";
    const ts = row["timestamp"] ?? "";

    // ── Iteration tracking ──
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

    // ── Active days (from user_prompt timestamps) ──
    if (eventType === "user_prompt" && ts.length >= 10) {
      const date = ts.slice(0, 10);
      dayPromptMap.set(date, (dayPromptMap.get(date) ?? 0) + 1);
    }

    // ── Per-session verification accum ──
    if (!sessionId) continue;
    if (!sessionAccum[sessionId]) {
      sessionAccum[sessionId] = { promptCount: 0, toolCallCount: 0, readAfterWriteCount: 0, totalWriteFollowedCount: 0, lastToolName: "" };
    }
    const sa = sessionAccum[sessionId]!;
    if (eventType === "user_prompt") sa.promptCount++;
    if (eventType === "tool_call") {
      sa.toolCallCount++;
      const prevIsWrite = ["Write", "Edit", "MultiEdit", "ApplyPatch"].includes(sa.lastToolName);
      if (toolName === "Read" && prevIsWrite) sa.readAfterWriteCount++;
      if (prevIsWrite) sa.totalWriteFollowedCount++;
      sa.lastToolName = toolName || sa.lastToolName;
    }

    // ── Token accumulation (assistant_response rows when --tokens was used) ──
    if (hasTokenCols && eventType === "assistant_response") {
      const it = parseInt(row["input_tokens"] ?? "");
      if (!isNaN(it) && it > 0) {
        totalInputTokens += it;
        totalOutputTokens += parseInt(row["output_tokens"] ?? "0") || 0;
        totalCacheCreationTokens += parseInt(row["cache_creation_tokens"] ?? "0") || 0;
        totalCacheReadTokens += parseInt(row["cache_read_tokens"] ?? "0") || 0;
        hasAnyTokenData = true;
      }
    }

    // ── Prompt length (when --messages was used) ──
    if (hasMessageCol && eventType === "user_prompt") {
      const msg = row["message_text"] ?? "";
      if (msg) { totalPromptLength += msg.length; promptsWithText++; }
    }
  }

  // Finalize last session
  if (currentSession && currentSessionPrompts > 0) {
    iterationsPerSession.push(currentSessionIterations / currentSessionPrompts);
  }

  const avgIter =
    iterationsPerSession.length > 0
      ? iterationsPerSession.reduce((a, b) => a + b, 0) / iterationsPerSession.length
      : 0;

  const totalTools = Object.values(toolCounts).reduce((a, b) => a + b, 0);
  const toolMix: ToolMix[] = Object.entries(toolCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({
      name, count,
      pct: Math.round((count / totalTools) * 100),
      color: TOOL_COLORS[name] ?? "bg-slate-400",
      meaning: TOOL_MEANINGS[name] ?? "",
    }));

  // Global verification ratio
  const globalRAW = Object.values(sessionAccum).reduce((s, sa) => s + sa.readAfterWriteCount, 0);
  const globalWF = Object.values(sessionAccum).reduce((s, sa) => s + sa.totalWriteFollowedCount, 0);
  const globalVerificationRatio = globalWF > 0 ? globalRAW / globalWF : 0;

  // Active days
  const activeDays = Array.from(dayPromptMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, promptCount]) => ({ date, promptCount }));
  const uniqueDays = activeDays.length;
  const busiestDay = activeDays.length > 0
    ? activeDays.reduce((best, d) => d.promptCount > best.promptCount ? d : best).date
    : null;

  const totalSessions = totalSessionsSet.size;
  const avgSessionLengthTools = totalSessions > 0 ? totalToolCalls / totalSessions : 0;

  // Cache hit rate
  const cacheTotal = totalInputTokens + totalCacheReadTokens + totalCacheCreationTokens;
  const cacheHitRate = cacheTotal > 0 ? totalCacheReadTokens / cacheTotal : 0;

  return {
    totalPrompts,
    totalSessions,
    totalToolCalls,
    avgIterationsPerPrompt: Math.round(avgIter * 10) / 10,
    writeRatio: totalTools > 0
      ? Math.round(
          (((toolCounts["Write"] ?? 0) + (toolCounts["Edit"] ?? 0) + (toolCounts["MultiEdit"] ?? 0) + (toolCounts["ApplyPatch"] ?? 0)) / totalTools) * 100
        ) / 100
      : 0,
    globalVerificationRatio,
    toolMix,
    activeDays,
    uniqueDays,
    avgPromptsPerDay: uniqueDays > 0 ? Math.round((totalPrompts / uniqueDays) * 10) / 10 : 0,
    busiestDay,
    avgSessionLengthTools: Math.round(avgSessionLengthTools * 10) / 10,
    hasTokenData: hasAnyTokenData,
    ...(hasAnyTokenData ? {
      totalInputTokens,
      totalOutputTokens,
      totalCacheReadTokens,
      totalCacheCreationTokens,
      cacheHitRate: Math.round(cacheHitRate * 1000) / 1000,
    } : {}),
    hasMessageData: promptsWithText > 0,
    ...(promptsWithText > 0 ? { avgPromptLength: Math.round(totalPromptLength / promptsWithText) } : {}),
    isDemoData: false,
  };
}

// ---------------------------------------------------------------------------
// Upload zone
// ---------------------------------------------------------------------------

function UploadZone({ onParsed }: {
  onParsed: (sessionLogReport: SessionLogReport | null, aumPartial: Partial<AUMData>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const name = file.name.toLowerCase();
      const looksJson = name.endsWith(".json") || name.endsWith(".jsonl") || /^\s*[\[{]/.test(text);
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
        e.preventDefault(); setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <input
        ref={inputRef} type="file"
        accept=".csv,.json,.jsonl,text/csv,application/json"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <Upload className="mx-auto size-8 text-muted-foreground mb-3" />
      <p className="font-semibold text-sm mb-1">Upload your AI usage trace</p>
      <p className="text-xs text-muted-foreground max-w-lg mx-auto space-y-1">
        <span className="block">
          <strong>Basic CSV:</strong>{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">./ai_usage_stats.py --filter your-repo-name</code>
        </span>
        <span className="block">
          <strong>+ token metrics:</strong> add{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">--tokens</code>
          {" "}for cache hit rate and token counts
        </span>
        <span className="block">
          <strong>+ prompt quality:</strong> add{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">--messages</code>
          {" "}to unlock avg prompt length analysis
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
          <Badge variant="outline" className="text-xs font-normal">Optional · runs on your laptop</Badge>
        </p>
        <p className="text-muted-foreground">
          This tab charts tool traces from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">ai_usage_trace.csv</code>. The{" "}
          <a href={AGENT_STATS_REPO_URL} target="_blank" rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline">
            masc-ucsc/agent_stats
          </a>{" "}
          repo scans local Claude Code, Codex CLI, and Gemini CLI logs — nothing is uploaded until you choose a file here.
        </p>
        <ol className="list-decimal space-y-2 pl-5 marker:text-foreground/80 text-muted-foreground">
          <li>Clone the repo and open a terminal in that folder.</li>
          <li>
            Run{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs break-all text-foreground">
              ./ai_usage_stats.py --filter your-repo-slug
            </code>
            {" "}— add{" "}
            <code className="rounded bg-muted px-1 text-xs text-foreground">--tokens</code>
            {" "}for cache hit rate,{" "}
            <code className="rounded bg-muted px-1 text-xs text-foreground">--messages</code>
            {" "}for prompt quality.
          </li>
          <li>
            Drag <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">ai_usage_trace.csv</code>{" "}
            into the upload zone below.
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
  const [sessionLogReport, setSessionLogReport] = useState<SessionLogReport | null>(DEMO_SESSION_LOG_REPORT);
  const coachExplain = useCoachExplain();

  const mergeParsed = (sessionLog: SessionLogReport | null, parsed: Partial<AUMData>) => {
    setSessionLogReport(sessionLog);
    setData((prev) => ({ ...prev, ...parsed, isDemoData: false }));
  };

  const overallAUM = data.totalPrompts > 0
    ? Math.round(computeAUMScore(data.avgIterationsPerPrompt, data.globalVerificationRatio, data.totalSessions))
    : 0;
  const { label: overallLabel } = aumColor(overallAUM);

  const sessionLogEfficiencyHint = sessionLogReport
    ? efficiencyBandHint(Math.round(sessionLogReport.scorecard.efficiency * 100))
    : null;

  const heatmapGrid = buildAiActivityGrid(data.activeDays);
  const monthLabels = heatmapGrid ? getMonthLabels(heatmapGrid.columnWeekStarts) : [];

  const cacheHitPct = data.cacheHitRate != null ? Math.round(data.cacheHitRate * 100) : null;
  const avgPromptLen = data.avgPromptLength ?? 0;
  const promptLenLabel =
    avgPromptLen < 50 ? "Very short — likely vague" :
    avgPromptLen < 200 ? "Concise" : "Detailed";

  const toolCallsPerPrompt = data.totalPrompts > 0 ? data.totalToolCalls / data.totalPrompts : 0;

  return (
    <div className="space-y-8">
      <AgentStatsExportInsight />

      {/* ── Demo / success banner + upload ── */}
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
              <span>Upload your trace below to see your team&apos;s actual AI usage metrics.</span>
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
          <Button variant="ghost" size="sm" className="text-xs shrink-0"
            onClick={() => { setSessionLogReport(DEMO_SESSION_LOG_REPORT); setData(DEMO_DATA); }}>
            Reset to demo
          </Button>
        </div>
      )}

      {/* ── Session log section (JSON/JSONL upload only) ── */}
      {sessionLogReport && (
        <section className="space-y-4">
          <SessionLogSummaryInsight report={sessionLogReport} />
          {sessionLogReport.warnings.length > 0 ? (
            <CoachInsightTone tone="concern" title="Parse warnings" className={aiTraceInsightSurface}
              bodyClassName="text-foreground/90 font-normal text-sm">
              <ul className="list-disc pl-5 text-xs space-y-0.5 marker:text-foreground">
                {sessionLogReport.warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </CoachInsightTone>
          ) : null}
          <h2 className="text-lg font-semibold">Core signals</h2>
          {!sessionLogReport.tokens.hasUsageData ? (
            <Badge variant="secondary" className="text-[10px] w-fit">Token usage not found in export</Badge>
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
                  <p className={`text-sm font-medium ${sessionLogEfficiencyHint.className}`}>{sessionLogEfficiencyHint.text}</p>
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
                  Combines verification-style habits (read-back after edits, test-like shell commands) with
                  blind-edit pressure — not a security audit.
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
                    ? `${Math.round(sessionLogReport.metrics.discoveryRatio * 100)}%` : "—"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Discovery depth:{" "}
                  <span className="font-medium text-foreground">
                    {sessionLogReport.scorecard.discovery_depth.toLowerCase()}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Exploratory vs action tool-call mix. Bands: High ≥38%, Medium 18–38%, Low ≤18%.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ── Section 1: Score + key stats ── */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">AI usage profile</h2>
          <CoachAiActionButton
            send={coachExplain}
            tooltip="Send your usage profile to Repo Coach for feedback."
            prompt={buildAiMaturityAggregateCoachPrompt(buildAiUsageProfileBrief(data, sessionLogReport))}
          >
            <Sparkles className="size-4" aria-hidden />
            Ask Coach
          </CoachAiActionButton>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <CoachInsightTone
            tone="informational"
            title="AUM score"
            className={cn("col-span-full sm:col-span-2 lg:col-span-1", aiTraceInsightSurface)}
            bodyClassName="space-y-3 text-foreground/90 font-normal"
          >
            <Brain className="size-4 text-muted-foreground" aria-hidden />
            <div className="text-4xl font-bold tabular-nums">{overallAUM}</div>
            <div className="text-sm text-muted-foreground">{overallLabel} · out of 100</div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div className={`${aumColor(overallAUM).bar} h-2 rounded-full`} style={{ width: `${overallAUM}%` }} />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2">
              50% iteration discipline + 50% verification ratio
            </p>
          </CoachInsightTone>
          <KpiCard
            label="Total prompts"
            value={data.totalPrompts.toLocaleString()}
            sub="Messages sent to the AI agent"
            icon={Brain}
          />
          <KpiCard
            label="Total tool calls"
            value={data.totalToolCalls.toLocaleString()}
            sub="Tools invoked across all sessions"
            icon={BarChart3}
          />
          <KpiCard
            label="Avg iterations / prompt"
            value={data.avgIterationsPerPrompt}
            sub="Tool calls per message — lower = clearer prompts"
            icon={Wrench}
            highlight={data.avgIterationsPerPrompt > 6 ? "warn" : data.avgIterationsPerPrompt <= 3 ? "good" : undefined}
          />
        </div>
        <details className="mt-4 rounded-lg border p-3 text-xs text-muted-foreground cursor-pointer">
          <summary className="font-medium text-foreground select-none">How the AUM score is computed</summary>
          <div className="mt-2 space-y-1 leading-relaxed">
            <p><strong>Iteration score (50%):</strong> max(0, 100 − (avg iterations per prompt − 1) × 15). Fewer tool-call rounds per prompt = clearer, more constrained asks.</p>
            <p><strong>Verification score (50%):</strong> (Read-after-Write events ÷ Write-followed events) × 100. Rewards reading files back after AI-generated edits before moving on.</p>
          </div>
        </details>
      </section>

      {/* ── Section 2: Active days heatmap ── */}
      {heatmapGrid && (
        <section>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-border/40 sm:p-6">
            <div className="flex flex-col gap-1 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground shrink-0" aria-hidden />
                <h2 className="text-base font-semibold">AI active days</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Each cell = one calendar day. Color intensity = prompts sent that day. Shows last {Math.min(data.uniqueDays > 0 ? heatmapGrid.columnWeekStarts.length : 0, MAX_HEATMAP_WEEKS)} weeks.
              </p>
            </div>
            <div className="overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
              <div
                className={cn("inline-flex min-w-0 flex-col", HEATMAP_GAP)}
                role="img"
                aria-label="AI activity heatmap — prompts per day by weekday and week"
              >
                {/* Month labels row */}
                <div className={cn("flex", HEATMAP_GAP)}>
                  <div className={cn(HEATMAP_LABEL_COL, "shrink-0")} />
                  {heatmapGrid.columnWeekStarts.map((_, w) => (
                    <div key={`mh-${w}`} className="w-4 shrink-0 sm:w-5">
                      <span className="text-[10px] font-medium leading-none text-muted-foreground">
                        {monthLabels[w] ?? ""}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Weekday rows */}
                {WEEKDAY_LETTERS.map((letter, d) => (
                  <div key={d} className={cn("flex items-center", HEATMAP_GAP)}>
                    <div className={cn(HEATMAP_LABEL_COL, "select-none")}>{letter}</div>
                    {heatmapGrid.grid[d]!.map((count, w) => (
                      <div
                        key={`${d}-${w}`}
                        title={`${WEEKDAY_NAMES[d]} ${heatmapGrid.columnWeekStarts[w] ?? ""}: ${count} prompt(s)`}
                        className={cn(HEATMAP_CELL, heatClass(count, heatmapGrid.maxCount))}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Less</span>
              <div className={cn("flex", HEATMAP_GAP)}>
                {[0.1, 0.35, 0.55, 0.8, 1].map((t, i) => (
                  <div key={i} className={cn("size-4 rounded-[3px] sm:size-5",
                    heatClass(Math.ceil(t * heatmapGrid.maxCount), heatmapGrid.maxCount))} />
                ))}
              </div>
              <span>More</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground tabular-nums">
              {data.uniqueDays} active days · {data.avgPromptsPerDay.toFixed(1)} prompts/day avg
              {data.busiestDay ? ` · Busiest: ${data.busiestDay}` : ""}
            </p>
          </div>
        </section>
      )}

      {/* ── Section 3: Session behavior ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground shrink-0" aria-hidden />
          <h2 className="text-lg font-semibold">Session behavior</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Sessions"
            value={data.totalSessions.toLocaleString()}
            sub="Distinct Claude Code work sessions"
            icon={BarChart3}
          />
          <KpiCard
            label="Avg prompts / session"
            value={data.totalSessions > 0 ? (data.totalPrompts / data.totalSessions).toFixed(1) : "—"}
            sub="Messages per work session"
            icon={Brain}
          />
          <KpiCard
            label="Avg tool calls / session"
            value={data.avgSessionLengthTools.toFixed(1)}
            sub="How deeply the AI worked each session"
            icon={Wrench}
          />
          <KpiCard
            label="Prompts per active day"
            value={data.avgPromptsPerDay.toFixed(1)}
            sub="AI intensity on days you used it"
            icon={Calendar}
          />
        </div>
      </section>

      {/* ── Section 4: Tool mix ── */}
      <section>
        <CoachInsightTone
          tone="informational"
          title="Tool mix"
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
              <div key={t.name} className={`${t.color} transition-all`}
                style={{ width: `${t.pct}%` }} title={`${t.name}: ${t.pct}%`} />
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
          <div className="border-t border-border/40 pt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{Math.round(data.writeRatio * 100)}%</span>
              {" "}write ratio — Write + Edit + MultiEdit + ApplyPatch ÷ all tool calls
            </span>
            <span>
              <span className="font-semibold text-foreground">{Math.round(data.globalVerificationRatio * 100)}%</span>
              {" "}verification ratio — Read-after-Write ÷ Write-followed events
            </span>
          </div>
        </CoachInsightTone>
      </section>

      {/* ── Section 5: Agentic usage ── */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Zap className="size-4 text-muted-foreground shrink-0" aria-hidden />
          <h2 className="text-lg font-semibold">Agentic usage</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            label="Tool calls / prompt"
            value={toolCallsPerPrompt > 0 ? toolCallsPerPrompt.toFixed(1) : "—"}
            sub={
              toolCallsPerPrompt > 6 ? "Multi-step autonomous tasks" :
              toolCallsPerPrompt > 0 && toolCallsPerPrompt < 2 ? "Shallow use — mostly chat" :
              "Balanced agentic depth"
            }
            icon={Zap}
            highlight={toolCallsPerPrompt > 10 ? "warn" : undefined}
          />
          <KpiCard
            label="Tool diversity"
            value={`${data.toolMix.length} tools`}
            sub="Distinct tool types used across all sessions"
            icon={Wrench}
          />
          <KpiCard
            label="Most-used tool"
            value={data.toolMix[0]?.name ?? "—"}
            sub={data.toolMix[0] ? `${data.toolMix[0].pct}% of tool calls · ${data.toolMix[0].meaning}` : ""}
            icon={BarChart3}
          />
        </div>
      </section>

      {/* ── Section 6: Token efficiency (conditional) ── */}
      {data.hasTokenData && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="size-4 text-muted-foreground shrink-0" aria-hidden />
            <h2 className="text-lg font-semibold">Token efficiency</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Input tokens"
              value={(data.totalInputTokens ?? 0).toLocaleString()}
              sub="Tokens sent to the model — prompts + file context + history"
              icon={Brain}
            />
            <KpiCard
              label="Output tokens"
              value={(data.totalOutputTokens ?? 0).toLocaleString()}
              sub="Tokens generated by the model — replies + code"
              icon={Sparkles}
            />
            <KpiCard
              label="Cache hit rate"
              value={cacheHitPct != null ? `${cacheHitPct}%` : "—"}
              sub="cache_read ÷ (input + cache_read + cache_creation) — higher = faster & cheaper"
              icon={Zap}
              highlight={cacheHitPct != null ? (cacheHitPct >= 40 ? "good" : cacheHitPct >= 20 ? "warn" : "bad") : undefined}
            />
            <KpiCard
              label="Tokens / prompt"
              value={data.totalPrompts > 0
                ? (((data.totalInputTokens ?? 0) + (data.totalOutputTokens ?? 0)) / data.totalPrompts).toFixed(0)
                : "—"}
              sub="Avg total tokens consumed per message"
              icon={BarChart3}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed max-w-2xl">
            Cache hit rate benchmarks:{" "}
            <strong className="text-green-600 dark:text-green-400">≥ 40%</strong> good ·{" "}
            <strong className="text-yellow-600 dark:text-yellow-400">20–40%</strong> moderate ·{" "}
            <strong className="text-red-600 dark:text-red-400">&lt; 20%</strong> low.
            A low rate often means the model is re-reading large context without caching benefits —
            shorter, more focused sessions can help.
          </p>
        </section>
      )}

      {/* ── Section 7: Prompt quality (conditional) ── */}
      {data.hasMessageData && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="size-4 text-muted-foreground shrink-0" aria-hidden />
            <h2 className="text-lg font-semibold">Prompt quality</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard
              label="Avg prompt length"
              value={`${avgPromptLen} chars`}
              sub={promptLenLabel}
              icon={MessageSquare}
              highlight={avgPromptLen < 50 ? "warn" : avgPromptLen >= 200 ? "good" : undefined}
            />
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Length benchmarks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground">
                <p><strong className="text-red-600 dark:text-red-400">&lt; 50 chars</strong> — Very short, likely vague ("fix it", "add tests")</p>
                <p><strong className="text-foreground">50–200 chars</strong> — Concise, reasonable</p>
                <p><strong className="text-green-600 dark:text-green-400">&gt; 200 chars</strong> — Detailed with context and constraints</p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* ── What to try next ── */}
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
              finding: "Planning habits carry through the rest of a session — vague goals show up as churn later.",
              action: "Before the next coding block: write constraints, acceptance criteria, and files in scope. Avoid opening with only \"build X\".",
            },
            {
              priority: 2,
              title: "Structure testing-assistant turns",
              finding: "Testing often shows higher iteration counts — usually from underspecified failure cases or skipping the suite.",
              action: "For each AI-suggested test: name the failure mode, accept or reject with a one-line reason, and run tests before commit.",
            },
            {
              priority: 3,
              title: "Verify before you commit",
              finding: `Your write ratio is ${Math.round(data.writeRatio * 100)}%. Large write shares deserve a quick read-back and lint.`,
              action: "After substantive Write/Edit bursts: skim the diff, run the linter, and run targeted tests before staging.",
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
