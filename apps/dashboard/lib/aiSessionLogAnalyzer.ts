/**
 * Parses flexible AI session logs (JSONL / single JSON / JSON array) and computes
 * a deterministic session report aligned with docs/planning/AI_SESSION_LOG_ANALYZER.md.
 * Git-enriched metrics (Token ROI, manual intervention) are omitted unless wired later.
 */

export const LOG_ANALYZER_VERSION = "1.0.0";

export interface NormalizedEvent {
  sessionId: string;
  timestamp: number | null;
  workingDir?: string;
  eventType: "user_prompt" | "tool_call" | "tool_result";
  toolName?: string;
  toolInputFingerprint?: string;
  isError?: boolean;
  usage?: { input?: number; output?: number; reasoning?: number };
}

export interface SessionLogReport {
  logAnalyzerVersion: string;
  generatedAt: string;
  warnings: string[];
  input: { format: "json" | "jsonl"; lineCount: number; sessionCount: number };
  tokens: {
    input: number;
    output: number;
    reasoning: number | null;
    hasUsageData: boolean;
    maxInputInSingleRecord: number | null;
  };
  metrics: {
    discoveryRatio: number | null;
    verificationTestCommandRatio: number | null;
    blindEditRate: number | null;
    readAfterWriteRate: number | null;
    stuck: {
      totalLoops: number;
      averageLoopDepth: number;
      topFrictionFile: string | null;
    };
    enrichmentUnavailable: {
      tokenRoi: string;
      manualIntervention: string;
      promptToCommit: string;
    };
  };
  scorecard: {
    efficiency: number;
    safety_compliance: number;
    discovery_depth: "Low" | "Medium" | "High";
  };
  archetype: string;
  contributor: string | null;
  top_patterns: Array<{ pattern: string; frequency: string; status: "Healthy" | "Improvement Needed" | "N/A" }>;
  ai_coaching_tips: string[];
}

const DISCOVERY_TOOLS = new Set(
  [
    "Read",
    "Glob",
    "Grep",
    "codebase_search",
    "ListMcpResources",
    "ListMcpResource",
    "WebSearch",
    "WebFetch",
    "Search",
  ].map((s) => s.toLowerCase())
);

const ACTION_TOOLS = new Set(
  [
    "Write",
    "Edit",
    "MultiEdit",
    "ApplyPatch",
    "Bash",
    "shell",
    "RunTerminalCmd",
    "NotebookEdit",
    "TodoWrite",
  ].map((s) => s.toLowerCase())
);

const TEST_COMMAND_RE =
  /\b(test|vitest|jest|mocha|pytest|cypress|playwright|karma|gradle\s+test|npm\s+test|pnpm\s+test|yarn\s+test)\b/i;

function normTool(name: string | undefined): string {
  return (name ?? "").trim();
}

function isDiscoveryTool(name: string | undefined): boolean {
  const n = normTool(name).toLowerCase();
  if (!n) return false;
  if (DISCOVERY_TOOLS.has(n)) return true;
  if (n.startsWith("mcp")) return true;
  return false;
}

function isActionTool(name: string | undefined): boolean {
  const n = normTool(name).toLowerCase();
  if (!n) return false;
  return ACTION_TOOLS.has(n) || n === "bash" || n === "sh";
}

function isWriteLike(name: string | undefined): boolean {
  const n = normTool(name);
  return n === "Write" || n.toLowerCase() === "edit" || n === "MultiEdit";
}

function fingerprintFromUnknown(input: unknown): string | undefined {
  if (input == null) return undefined;
  if (typeof input === "string") {
    const pathMatch = input.match(/["']([^'"\\]+\.(tsx?|jsx?|md))["']/i);
    return pathMatch?.[1] ?? input.slice(0, 120);
  }
  if (typeof input === "object") {
    const o = input as Record<string, unknown>;
    const path =
      typeof o.file_path === "string"
        ? o.file_path
        : typeof o.path === "string"
          ? o.path
          : typeof o.command === "string"
            ? o.command
            : undefined;
    if (path) return path.slice(0, 200);
    try {
      return JSON.stringify(input).slice(0, 160);
    } catch {
      return undefined;
    }
  }
  return String(input).slice(0, 120);
}

function extractPathFromFingerprint(fp: string): string | null {
  if (!fp) return null;
  const m = fp.match(/([/.][^\s]+\.(tsx?|jsx?))/i);
  return m?.[1]?.replace(/^["']/, "") ?? null;
}

function splitRecords(text: string): unknown[] {
  const t = text.trim();
  if (!t) return [];
  if (t.startsWith("[")) {
    try {
      const parsed = JSON.parse(t) as unknown;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      /* fall through */
    }
  }
  if (t.startsWith("{") && !t.includes("\n")) {
    try {
      return [JSON.parse(t) as unknown];
    } catch {
      return [];
    }
  }
  if (t.startsWith("{")) {
    try {
      const parsed = JSON.parse(t) as unknown;
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      /* line-based */
    }
  }
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: unknown[] = [];
  for (const line of lines) {
    try {
      out.push(JSON.parse(line) as unknown);
    } catch {
      /* skip bad line */
    }
  }
  return out;
}

function getSessionId(obj: Record<string, unknown>, fallback: string): string {
  const s =
    obj.session_id ?? obj.sessionId ?? obj.uuid ?? obj.id ??
    (obj.metadata as Record<string, unknown> | undefined)?.session_id;
  return typeof s === "string" && s ? s : fallback;
}

function getTimestamp(obj: Record<string, unknown>): number | null {
  const c = obj.created_at ?? obj.timestamp ?? obj.ts ?? obj.time;
  if (typeof c === "number") return Number.isFinite(c) ? c : null;
  if (typeof c === "string") {
    const p = Date.parse(c);
    return Number.isFinite(p) ? p : null;
  }
  return null;
}

function getWorkingDir(obj: Record<string, unknown>): string | undefined {
  const w = obj.working_dir ?? obj.cwd ?? obj.workingDir;
  return typeof w === "string" ? w : undefined;
}

function pushFromCsvShape(obj: Record<string, unknown>, events: NormalizedEvent[], defaultSession: string): void {
  const sessionId = getSessionId(obj, defaultSession);
  const timestamp = getTimestamp(obj);
  const workingDir = getWorkingDir(obj);
  const eventType = String(obj.event_type ?? "");
  const toolName = typeof obj.tool_name === "string" ? obj.tool_name : undefined;

  if (eventType === "user_prompt") {
    events.push({ sessionId, timestamp, workingDir, eventType: "user_prompt" });
    return;
  }
  if (eventType === "tool_call") {
    events.push({
      sessionId,
      timestamp,
      workingDir,
      eventType: "tool_call",
      toolName,
      toolInputFingerprint: fingerprintFromUnknown(obj.tool_input ?? obj.args ?? obj.input),
    });
    return;
  }
  if (eventType === "tool_result") {
    events.push({
      sessionId,
      timestamp,
      workingDir,
      eventType: "tool_result",
      toolName,
      isError: Boolean(obj.error ?? obj.is_error ?? obj.status === "error"),
      toolInputFingerprint:
        typeof obj.tool_use_id === "string" ? obj.tool_use_id : fingerprintFromUnknown(obj.tool_input ?? obj.content),
    });
  }
}

function extractUsage(o: Record<string, unknown>): { input?: number; output?: number; reasoning?: number } | undefined {
  const raw = o.usage ?? o.usage_metadata ?? (o.message as Record<string, unknown> | undefined)?.usage;
  if (!raw || typeof raw !== "object") return undefined;
  const u = raw as Record<string, unknown>;
  const inputTokens =
    typeof u.input_tokens === "number"
      ? u.input_tokens
      : typeof u.input === "number"
        ? u.input
        : typeof u.prompt_tokens === "number"
          ? u.prompt_tokens
          : undefined;
  const outputTokens =
    typeof u.output_tokens === "number"
      ? u.output_tokens
      : typeof u.output === "number"
        ? u.output
        : typeof u.completion_tokens === "number"
          ? u.completion_tokens
          : undefined;
  let reasoningTokens: number | undefined;
  if (typeof u.reasoning_tokens === "number") reasoningTokens = u.reasoning_tokens;

  if (inputTokens === undefined && outputTokens === undefined && reasoningTokens === undefined) return undefined;
  return { input: inputTokens, output: outputTokens, reasoning: reasoningTokens };
}

function walkForEvents(node: unknown, ctx: { sessionId: string; events: NormalizedEvent[] }, depth: number): void {
  if (depth > 28) return;
  if (!node || typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (const n of node) walkForEvents(n, ctx, depth + 1);
    return;
  }

  const obj = node as Record<string, unknown>;

  if (Array.isArray(obj.messages)) {
    for (const m of obj.messages) walkForEvents(m, ctx, depth + 1);
  }

  if (typeof obj.event_type === "string") {
    ctx.sessionId = getSessionId(obj, ctx.sessionId);
    pushFromCsvShape(obj, ctx.events, ctx.sessionId);
    return;
  }

  const usage = extractUsage(obj);
  if (usage && (usage.input !== undefined || usage.output !== undefined || usage.reasoning !== undefined)) {
    ctx.sessionId = getSessionId(obj, ctx.sessionId);
    ctx.events.push({
      sessionId: ctx.sessionId,
      timestamp: getTimestamp(obj),
      workingDir: getWorkingDir(obj),
      eventType: "tool_call",
      toolName: "__usage__",
      usage,
    });
  }

  const role =
    typeof obj.role === "string"
      ? obj.role
      : typeof (obj.message as Record<string, unknown> | undefined)?.role === "string"
        ? String((obj.message as Record<string, unknown>).role)
        : undefined;
  const message =
    typeof obj.message === "object" && obj.message !== null ? (obj.message as Record<string, unknown>) : obj;
  const content = message.content ?? obj.content;

  if (role === "user" || obj.type === "human" || obj.type === "user") {
    ctx.sessionId = getSessionId(obj, ctx.sessionId);
    ctx.events.push({
      sessionId: ctx.sessionId,
      timestamp: getTimestamp(obj),
      workingDir: getWorkingDir(obj),
      eventType: "user_prompt",
    });
  }

  if (Array.isArray(content)) {
    ctx.sessionId = getSessionId(obj, ctx.sessionId);
    for (const block of content) {
      if (!block || typeof block !== "object") continue;
      const b = block as Record<string, unknown>;
      const t = typeof b.type === "string" ? b.type : "";
      if (t === "tool_use" && typeof b.name === "string") {
        ctx.events.push({
          sessionId: ctx.sessionId,
          timestamp: getTimestamp(obj),
          workingDir: getWorkingDir(obj),
          eventType: "tool_call",
          toolName: b.name,
          toolInputFingerprint: fingerprintFromUnknown(b.input),
        });
      }
      if (t === "tool_result") {
        const err = Boolean(b.is_error);
        ctx.events.push({
          sessionId: ctx.sessionId,
          timestamp: getTimestamp(obj),
          workingDir: getWorkingDir(obj),
          eventType: "tool_result",
          toolName: typeof b.name === "string" ? b.name : undefined,
          isError: err,
          toolInputFingerprint:
            typeof b.tool_use_id === "string" ? b.tool_use_id : fingerprintFromUnknown(b.content),
        });
      }
    }
  }

  const tc = obj.tool_calls;
  if (Array.isArray(tc)) {
    ctx.sessionId = getSessionId(obj, ctx.sessionId);
    for (const call of tc) {
      if (!call || typeof call !== "object") continue;
      const c = call as Record<string, unknown>;
      const fn = c.function as Record<string, unknown> | undefined;
      const name =
        typeof fn?.name === "string" ? fn.name : typeof c.name === "string" ? c.name : undefined;
      let argsText: unknown;
      if (typeof fn?.arguments === "string") {
        try {
          argsText = JSON.parse(fn.arguments as string);
        } catch {
          argsText = fn.arguments;
        }
      }
      if (name) {
        ctx.events.push({
          sessionId: ctx.sessionId,
          timestamp: getTimestamp(obj),
          workingDir: getWorkingDir(obj),
          eventType: "tool_call",
          toolName: name,
          toolInputFingerprint: fingerprintFromUnknown(argsText ?? c),
        });
      }
    }
  }

  for (const k of Object.keys(obj)) {
    if (["content", "usage", "usage_metadata", "tool_calls", "message"].includes(k)) continue;
    const v = obj[k];
    if (v && typeof v === "object") walkForEvents(v, ctx, depth + 1);
  }
}

/** Parse JSON text; detects json vs jsonl purely for labeling. */
export function parseSessionLogText(text: string): {
  events: NormalizedEvent[];
  warnings: string[];
  format: "json" | "jsonl";
} {
  const warnings: string[] = [];
  const trimmed = text.trim();
  let format: "json" | "jsonl" = "jsonl";
  if (trimmed.startsWith("[")) format = "json";

  let records: unknown[];
  try {
    records = splitRecords(text);
  } catch (e) {
    warnings.push(`Failed to parse as JSON / JSONL: ${e instanceof Error ? e.message : String(e)}`);
    return { events: [], warnings, format };
  }

  if (records.length === 0) warnings.push("No JSON records parsed from file.");

  const ctx = { sessionId: "default-session", events: [] as NormalizedEvent[] };
  for (const rec of records) {
    walkForEvents(rec, ctx, 0);
  }

  const events = [...ctx.events].sort((a, b) => {
    const ta = a.timestamp ?? 0;
    const tb = b.timestamp ?? 0;
    if (ta !== tb) return ta - tb;
    return 0;
  });

  return { events, warnings, format };
}

export function stripSyntheticUsage(events: NormalizedEvent[]): NormalizedEvent[] {
  return events.filter((e) => e.toolName !== "__usage__");
}

/** CSV compatible with AIMaturityTab `parseCSV` (comma-safe values avoided). */
export function normalizedEventsToCsv(events: NormalizedEvent[]): string {
  const lines = ["event_type,tool_name,session_id,working_dir,timestamp"];
  for (const e of stripSyntheticUsage(events)) {
    const ts = e.timestamp != null ? new Date(e.timestamp).toISOString() : "";
    const wd = (e.workingDir ?? "").replace(/,/g, " ");
    const sid = e.sessionId.replace(/,/g, "");
    const safe = (s: string) => s.replace(/,/g, " ");
    if (e.eventType === "user_prompt") {
      lines.push(`user_prompt,,${sid},${wd},${ts}`);
    } else if (e.eventType === "tool_call") {
      lines.push(`tool_call,${safe(e.toolName ?? "")},${sid},${wd},${ts}`);
    } else {
      lines.push(`tool_result,${safe(e.toolName ?? "")},${sid},${wd},${ts}`);
    }
  }
  return lines.join("\n");
}

function frac(n: number, d: number): number | null {
  if (d <= 0) return null;
  return Math.round((n / d) * 1000) / 1000;
}

export function computeSessionLogReport(
  events: NormalizedEvent[],
  warningsIn: string[],
  inputFormat: "json" | "jsonl"
): SessionLogReport {
  const warnings = [...warningsIn];
  const usable = stripSyntheticUsage(events);

  const usageEvents = events.filter((e) => e.toolName === "__usage__" && e.usage);

  let inputSum = 0;
  let outputSum = 0;
  let reasoningSum: number | null = null;
  let maxInput: number | null = null;

  for (const e of usageEvents) {
    const u = e.usage;
    if (!u) continue;
    if (typeof u.input === "number") {
      inputSum += u.input;
      maxInput = maxInput === null ? u.input : Math.max(maxInput, u.input);
    }
    if (typeof u.output === "number") outputSum += u.output;
    if (typeof u.reasoning === "number") {
      reasoningSum = (reasoningSum ?? 0) + u.reasoning;
    }
  }
  const hasUsageData =
    usageEvents.length > 0 &&
    ((inputSum > 0 || outputSum > 0) || (reasoningSum !== null && reasoningSum > 0));

  const sessionIds = new Set(usable.map((e) => e.sessionId));

  let disc = 0;
  let act = 0;
  for (const e of usable) {
    if (e.eventType !== "tool_call" || !e.toolName) continue;
    const n = e.toolName;
    if (isDiscoveryTool(n)) disc++;
    else if (isActionTool(n)) act++;
  }
  const denomDA = disc + act;
  const discoveryRatio = denomDA > 0 ? frac(disc, denomDA) : null;

  let bashTest = 0;
  let bashTotal = 0;
  for (const e of usable) {
    if (e.eventType !== "tool_call") continue;
    const n = (e.toolName ?? "").toLowerCase();
    const isShell =
      n.includes("bash") || n.includes("shell") || n === "run_terminal_cmd" || n === "terminal";
    if (!isShell) continue;
    bashTotal++;
    const fp = `${e.toolInputFingerprint ?? ""}`;
    if (TEST_COMMAND_RE.test(fp)) bashTest++;
  }
  const verificationTestCommandRatio = bashTotal > 0 ? frac(bashTest, bashTotal) : null;

  let blindEdits = 0;
  let totalWrites = 0;
  for (let i = 0; i < usable.length; i++) {
    const e = usable[i];
    if (e.eventType !== "tool_call" || !e.toolName || !isWriteLike(e.toolName)) continue;
    totalWrites++;
    let sawDiscovery = false;
    for (let j = i - 1; j >= 0; j--) {
      const prev = usable[j];
      if (prev.eventType === "user_prompt") break;
      if (prev.eventType === "tool_call" && prev.toolName && isDiscoveryTool(prev.toolName)) {
        sawDiscovery = true;
        break;
      }
    }
    if (!sawDiscovery) blindEdits++;
  }

  const toolCallsOnly = usable.filter((e) => e.eventType === "tool_call" && e.toolName);
  let readAfterWrite = 0;
  let writeFollowed = 0;
  for (let i = 1; i < toolCallsOnly.length; i++) {
    const prev = toolCallsOnly[i - 1];
    const cur = toolCallsOnly[i];
    if (!prev.toolName || !cur.toolName) continue;
    const p = normTool(prev.toolName).toLowerCase();
    const isPW = p === "write" || p === "edit";
    if (isPW) writeFollowed++;
    if (isPW && normTool(cur.toolName) === "Read") readAfterWrite++;
  }

  const readAfterWriteRate = writeFollowed > 0 ? frac(readAfterWrite, writeFollowed) : null;
  const blindEditRate = totalWrites > 0 ? frac(blindEdits, totalWrites) : null;

  const frictionByFile: Record<string, number> = {};
  let loopCount = 0;
  let sumDepth = 0;
  let prevKeyForLoop = "";
  let streak = 0;

  for (const e of usable) {
    if (e.eventType === "tool_result" && e.isError) {
      const pathFromResult = extractPathFromFingerprint(e.toolInputFingerprint ?? "");
      if (pathFromResult) frictionByFile[pathFromResult] = (frictionByFile[pathFromResult] ?? 0) + 1;
    }

    if (e.eventType !== "tool_call" || !e.toolName) continue;
    const key = `${normTool(e.toolName)}|${e.toolInputFingerprint ?? ""}`;
    if (key.length <= 3) continue;

    if (key === prevKeyForLoop && prevKeyForLoop !== "") {
      streak++;
    } else {
      if (streak >= 2) {
        loopCount++;
        sumDepth += streak + 1;
      }
      prevKeyForLoop = key;
      streak = 1;
    }
  }
  if (streak >= 2) {
    loopCount++;
    sumDepth += streak + 1;
  }

  let topFrictionFile: string | null = null;
  let maxF = 0;
  for (const [f, n] of Object.entries(frictionByFile)) {
    if (n > maxF) {
      maxF = n;
      topFrictionFile = f;
    }
  }

  const averageLoopDepth = loopCount > 0 ? Math.round((sumDepth / loopCount) * 10) / 10 : 0;

  const promptCount = Math.max(
    1,
    usable.filter((e) => e.eventType === "user_prompt").length
  );
  const toolCallCount = usable.filter((e) => e.eventType === "tool_call").length;
  const avgIterationsProxy = toolCallCount / promptCount;

  const iterScore = Math.max(0, Math.min(1, 1 - Math.max(0, avgIterationsProxy - 1) / 8));
  const discoverScore = discoveryRatio === null ? 0.5 : Math.min(1, discoveryRatio * 1.35);
  const efficiency = Math.round(Math.max(0, Math.min(1, iterScore * 0.55 + discoverScore * 0.45)) * 100) / 100;

  let verifBlend = 0.5;
  if (readAfterWriteRate != null && verificationTestCommandRatio != null) {
    verifBlend = (readAfterWriteRate + verificationTestCommandRatio) / 2;
  } else if (readAfterWriteRate != null) {
    verifBlend = readAfterWriteRate;
  } else if (verificationTestCommandRatio != null) {
    verifBlend = verificationTestCommandRatio;
  }

  const blindPenalty = blindEditRate != null ? Math.max(0, 1 - blindEditRate * 2) : 0.7;
  const safety_compliance =
    Math.round(Math.max(0, Math.min(1, verifBlend * 0.7 + blindPenalty * 0.3)) * 100) / 100;

  let discovery_depth: "Low" | "Medium" | "High" = "Medium";
  if (discoveryRatio !== null) {
    if (discoveryRatio >= 0.38) discovery_depth = "High";
    else if (discoveryRatio <= 0.18) discovery_depth = "Low";
  }

  let archetype = "Balanced Collaborator";
  if (
    discoveryRatio !== null &&
    discoveryRatio > 0.35 &&
    (readAfterWriteRate ?? 0) > 0.45 &&
    avgIterationsProxy < 6
  ) {
    archetype = "Senior Orchestrator";
  } else if ((blindEditRate ?? 0) > 0.35) {
    archetype = "Fast but Risky";
  } else if (discoveryRatio !== null && discoveryRatio < 0.15) {
    archetype = "Implementation Focused";
  }

  const verifyPct = readAfterWriteRate != null ? Math.round(readAfterWriteRate * 100) : null;
  const blindPct = blindEditRate != null ? Math.round(blindEditRate * 100) : null;

  const top_patterns: SessionLogReport["top_patterns"] = [
    {
      pattern: "Verify-Before-Commit",
      frequency: verifyPct != null ? `${verifyPct}%` : "N/A",
      status:
        verifyPct != null && verifyPct >= 60
          ? "Healthy"
          : verifyPct != null
            ? "Improvement Needed"
            : "N/A",
    },
    {
      pattern: "Blind Edit (No Search)",
      frequency: blindPct != null ? `${blindPct}%` : "N/A",
      status:
        blindPct != null && blindPct <= 15
          ? "Healthy"
          : blindPct != null
            ? "Improvement Needed"
            : "N/A",
    },
  ];

  const tips: string[] = [];
  if (discoveryRatio !== null && discoveryRatio < 0.2) {
    tips.push(
      "Increase discovery work (Read, Grep, Glob) before large writes to reduce blind-edit risk."
    );
  }
  if ((verificationTestCommandRatio ?? 0) < 0.2 && bashTotal > 2) {
    tips.push(
      "Run unit or integration tests from the shell earlier in the session to catch failures sooner."
    );
  }
  if (loopCount >= 2) {
    tips.push(
      topFrictionFile
        ? `Repeated tool friction detected; validate assumptions for ${topFrictionFile} before retrying.`
        : "Repeated similar tool calls detected — narrow the task or verify inputs before looping."
    );
  }
  if (!hasUsageData) {
    tips.push(
      'Token totals were not found in this file—export logs that include usage or usage_metadata on messages.'
    );
  }
  if (tips.length === 0)
    tips.push("Keep pairing exploratory reads with small, verifiable edits.");

  const report: SessionLogReport = {
    logAnalyzerVersion: LOG_ANALYZER_VERSION,
    generatedAt: new Date().toISOString(),
    warnings,
    input: {
      format: inputFormat,
      lineCount: usable.length,
      sessionCount: sessionIds.size,
    },
    tokens: {
      input: inputSum,
      output: outputSum,
      reasoning: reasoningSum,
      hasUsageData,
      maxInputInSingleRecord: maxInput,
    },
    metrics: {
      discoveryRatio,
      verificationTestCommandRatio,
      blindEditRate,
      readAfterWriteRate,
      stuck: {
        totalLoops: loopCount,
        averageLoopDepth: averageLoopDepth,
        topFrictionFile,
      },
      enrichmentUnavailable: {
        tokenRoi: "Requires git diff joined to sessions (high enrichment difficulty).",
        manualIntervention:
          "Requires comparing git-authored lines to AI attribution (high enrichment difficulty).",
        promptToCommit:
          "Requires correlating prompts with git timestamps/commits (high enrichment difficulty).",
      },
    },
    scorecard: { efficiency, safety_compliance, discovery_depth },
    archetype,
    contributor: null,
    top_patterns,
    ai_coaching_tips: tips,
  };

  return report;
}

/** End-to-end: parse JSONL/json + compute deterministic report + CSV for legacy AUM. */
export function analyzeSessionLogFile(text: string): {
  report: SessionLogReport;
  csvText: string;
} {
  const { events, warnings, format } = parseSessionLogText(text);
  const report = computeSessionLogReport(events, warnings, format);
  const csvText = normalizedEventsToCsv(events);
  return { report, csvText };
}

/** Sample session report shown in AI Maturity tab demo mode (paired with CSV demo AUM). */
export const DEMO_SESSION_LOG_REPORT: SessionLogReport = {
  logAnalyzerVersion: LOG_ANALYZER_VERSION,
  generatedAt: "1970-01-01T00:00:00.000Z",
  warnings: [],
  input: { format: "jsonl", lineCount: 412, sessionCount: 3 },
  tokens: {
    input: 184_200,
    output: 42_800,
    reasoning: 12_400,
    hasUsageData: true,
    maxInputInSingleRecord: 96_000,
  },
  metrics: {
    discoveryRatio: 0.42,
    verificationTestCommandRatio: 0.55,
    blindEditRate: 0.04,
    readAfterWriteRate: 0.72,
    stuck: {
      totalLoops: 2,
      averageLoopDepth: 3,
      topFrictionFile: "src/auth/middleware.ts",
    },
    enrichmentUnavailable: {
      tokenRoi: "Requires git diff joined to sessions (high enrichment difficulty).",
      manualIntervention:
        "Requires comparing git-authored lines to AI attribution (high enrichment difficulty).",
      promptToCommit:
        "Requires correlating prompts with git timestamps/commits (high enrichment difficulty).",
    },
  },
  scorecard: {
    efficiency: 0.88,
    safety_compliance: 0.95,
    discovery_depth: "High",
  },
  archetype: "Senior Orchestrator",
  contributor: null,
  top_patterns: [
    {
      pattern: "Verify-Before-Commit",
      frequency: "92%",
      status: "Healthy",
    },
    {
      pattern: "Blind Edit (No Search)",
      frequency: "4%",
      status: "Healthy",
    },
  ],
  ai_coaching_tips: [
    "Discovery: your verification and discovery signals are solid in this snapshot — keep pairing reads with small edits.",
    "Recommendation: run your test suite earlier after substantive shell or Write activity so failures surface before late-session churn.",
  ],
};
