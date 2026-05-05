import type { ReactNode } from "react";

/** Shared layout for metric help dialogs — matches Phase 3 narrative + formula box tone. */
export function HelpSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-2 text-foreground">{children}</div>
    </div>
  );
}

export function FormulaBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-sky-200/80 bg-sky-50/90 px-3 py-2 text-xs leading-relaxed dark:border-sky-900/60 dark:bg-sky-950/40">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RQ3 — structural / hygiene                                           */
/* ------------------------------------------------------------------ */

export function RQ3MaintainabilityScoreBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          A single repo-level <strong>maintainability index</strong> on a 0–100 scale. Higher values
          suggest relatively easier maintenance given average complexity, size, and function length.
          This is <strong>not</strong> the per-function GRAD-AI MI shown in Phase 2 · Lexical.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Uses a Coleman-style composite (Visual Studio / SEI family): natural logs of average
          cyclomatic complexity, total lines of code, and average function length are combined, then
          normalized to 0–100.
        </p>
        <FormulaBox>
          <span className="text-muted-foreground">Let MI_raw = </span>
          max(0, 171 − 5.2·ln(avg CC) − 0.23·ln(total LOC) − 16.2·ln(avg function length))
          <br />
          <span className="text-muted-foreground">Score = round</span>(MI_raw × 100 / 171, 1 decimal)
        </FormulaBox>
        <p className="text-muted-foreground text-xs">
          ln uses max(argument, 1) so empty or tiny inputs do not break the log.
        </p>
      </HelpSection>
      <HelpSection title="Reference">
        <p className="text-xs text-muted-foreground">
          Coleman, D. et al., &quot;Using Metrics to Evaluate Software System Maintainability,&quot;{" "}
          <em>IEEE Computer</em>, 1994.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ3MaintainabilityClassBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          A discrete band for the repo-level maintainability score, for quick scanning (low /
          moderate / high).
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>Derived from the same score as &quot;Maintainability score&quot; using fixed cutoffs:</p>
        <FormulaBox>
          low: score &lt; 40
          <br />
          moderate: 40 ≤ score ≤ 65
          <br />
          high: score &gt; 65
        </FormulaBox>
      </HelpSection>
    </>
  );
}

export function RQ3CyclomaticAvgBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Mean <strong>cyclomatic complexity</strong> across all function-like units in scope (same
          basis as max / high-complexity counts).
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Per function: start at 1, then add branch points in the function body (control structures
          and <code className="rounded bg-muted px-1">&&</code> /{" "}
          <code className="rounded bg-muted px-1">||</code> in boolean expressions). Nested functions
          are not double-counted inside the parent.
        </p>
        <FormulaBox>average = sum(complexity) / number of functions</FormulaBox>
      </HelpSection>
    </>
  );
}

export function RQ3CyclomaticMaxBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>The worst single-function cyclomatic complexity in the analyzed codebase.</p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>Take the maximum of per-function complexity values (same definition as average).</p>
      </HelpSection>
    </>
  );
}

export function RQ3HighComplexityCountBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>How many functions exceed a fixed complexity threshold (tail risk).</p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Count functions where cyclomatic complexity is <strong>strictly greater than 10</strong>{" "}
          (i.e. 11+). This matches the engine&apos;s{" "}
          <code className="rounded bg-muted px-1">highComplexityFunctions</code> field.
        </p>
        <p className="text-muted-foreground text-xs">
          Some distribution metrics elsewhere use complexity ≥ 10 for &quot;high&quot; buckets; those
          differ slightly at exactly 10.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ3AvgFunctionLengthBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>Mean physical line count per function (lines belonging to that function&apos;s AST node).</p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <FormulaBox>average length = sum(lines per function) / number of functions</FormulaBox>
      </HelpSection>
    </>
  );
}

export function RQ3LongFunctionCountBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>How many functions are longer than the configured &quot;long function&quot; threshold.</p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Count function-like units whose line count is <strong>greater than 50</strong> lines (
          threshold <code className="rounded bg-muted px-1">LONG_FUNCTION_THRESHOLD</code> in the
          engine).
        </p>
      </HelpSection>
    </>
  );
}

export function RQ3MaxNestingDepthBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Deepest control-structure nesting observed inside any single function (if / loop / switch /
          try chains), not JSX depth.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          For each function, walk the body and track nesting depth when entering listed statement
          types; the card shows the maximum depth found in any function.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ3P90FunctionLengthBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          The <strong>90th percentile</strong> of function lengths: 90% of functions are this length
          or shorter (tail behavior).
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Sort all function lengths ascending; take the element at the 90th percentile index using
          the engine&apos;s percentile helper (same family as p50 / p75 in the report).
        </p>
      </HelpSection>
    </>
  );
}

export function RQ3P90ComplexityBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          The <strong>90th percentile</strong> of cyclomatic complexity values across functions.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>Sort per-function complexities; read off the 90th percentile the same way as P90 length.</p>
      </HelpSection>
    </>
  );
}

export function RQ3DuplicationPercentBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Approximate share of lines that participate in duplicate fragments, from token-based clone
          detection.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          The engine runs <strong>jscpd</strong> on TypeScript / TSX sources (JSON reporter), then
          reads the overall duplicated-line percentage from jscpd&apos;s statistics. If jscpd fails,
          duplication may be missing in the report.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ3PercentHighInTop10FilesBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Whether <strong>high-complexity</strong> work concentrates in the heaviest files (by total
          complexity), versus spread across the repo.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <ol className="list-decimal space-y-1 pl-4">
          <li>Label functions with complexity ≥ 10 as high-complexity (for this metric only).</li>
          <li>Rank files by sum of per-file complexity (highest first).</li>
          <li>
            Take the top ceil(10% of files), at least 1 file — the &quot;top 10%&quot; by complexity
            mass.
          </li>
          <li>
            Count how many high-complexity functions live in those files; divide by the total number
            of high-complexity functions repo-wide.
          </li>
        </ol>
        <FormulaBox>100 × (high-complexity functions in top files) / (all high-complexity functions)</FormulaBox>
        <p className="text-muted-foreground text-xs">
          100% means almost all high-complexity functions sit in the busiest files; lower values mean
          more dispersion.
        </p>
      </HelpSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* RQ2                                                                  */
/* ------------------------------------------------------------------ */

export function RQ2TestLocRatioBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>How much test code exists relative to production source lines (rough density).</p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <FormulaBox>test LOC ratio = test LOC / source LOC</FormulaBox>
        <p className="text-muted-foreground text-xs">
          Test files match <code className="rounded bg-muted px-1">*.test.ts(x)</code> and{" "}
          <code className="rounded bg-muted px-1">*.spec.ts(x)</code>; source LOC excludes those
          files.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ2PctCommitsTouchingTestsBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>How often commits touch at least one test file — a coupling signal between changes and tests.</p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          From git history with numstat: a commit counts if <strong>any</strong> changed path matches
          the test-file pattern. The percentage is (such commits) / (all commits).
        </p>
      </HelpSection>
    </>
  );
}

export function RQ2TestToFeatureCommitRatioBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Compares commits that touch a test file to commits that touch <strong>only</strong> non-test
          paths—another coupling angle than the simple percentage above.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <FormulaBox>ratio = (commits touching tests) ÷ (commits with no test file in the diff)</FormulaBox>
        <p className="text-muted-foreground text-xs">
          If there are no &quot;feature-only&quot; commits, the ratio is shown as 0. Same test-file
          pattern as <strong>% commits touching tests</strong>.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ2TestCoverageProxyBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          A <strong>static</strong> label for how much test code sits next to production code in the
          current tree—not line coverage from running tests.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <FormulaBox>ratio = test LOC ÷ source LOC</FormulaBox>
        <p className="text-muted-foreground text-xs pt-2">
          <strong>low:</strong> ratio &lt; 0.1 · <strong>moderate:</strong> 0.1–0.3 ·{" "}
          <strong>high:</strong> &gt; 0.3. Always uses the full-repository snapshot (does not follow the
          per-author churn dropdown).
        </p>
      </HelpSection>
    </>
  );
}

export function RQ2SymbolProximityScanBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Summary of the symbol-level scan below: how many functions have{" "}
          <strong>any</strong> static evidence linking them to tests versus none.
        </p>
      </HelpSection>
      <HelpSection title="Bands">
        <ul className="list-disc space-y-1 pl-4">
          <li>
            <strong>Referenced in test</strong> — function name appears in the paired test file.
          </li>
          <li>
            <strong>Paired file only</strong> — conventional test sibling exists, no name hit yet.
          </li>
          <li>
            <strong>No static link</strong> — no paired convention-style test file for this symbol row.
          </li>
        </ul>
        <p className="text-muted-foreground text-xs pt-2">
          This is not Istanbul-style coverage; it complements complexity-vs-proximity scatter/table.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ2RefactorCommitRatioBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Share of commits whose <strong>subject line</strong> suggests refactor-style work (keyword
          heuristic).
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Count commits where the subject matches (case-insensitive):{" "}
          <code className="rounded bg-muted px-1">refactor</code>,{" "}
          <code className="rounded bg-muted px-1">cleanup</code>,{" "}
          <code className="rounded bg-muted px-1">restructure</code>,{" "}
          <code className="rounded bg-muted px-1">rename</code>. Displayed value is that count divided
          by total commits, as a percentage.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ2RiskVsVerificationBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          A minimal 2×2 view: <strong>structural risk</strong> (complexity + long functions) versus{" "}
          <strong>verification density</strong> (test LOC ratio). Labels (Low/High) are derived from
          simple thresholds for readability.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p className="font-medium">Indices (0–1) on the dashboard</p>
        <FormulaBox>
          riskRaw = highComplexityCount + longFunctionCount
          <br />
          riskIndex = min(1, riskRaw / 20)
          <br />
          verificationIndex = min(1, testLocRatio × 5)
        </FormulaBox>
        <p className="font-medium pt-2">Quadrant labels</p>
        <ul className="list-disc space-y-1 pl-4">
          <li>
            Risk <strong>High</strong> if riskRaw ≥ 10, else <strong>Low</strong>.
          </li>
          <li>
            Verification <strong>High</strong> if testLocRatio ≥ 0.1, else <strong>Low</strong>.
          </li>
        </ul>
        <p className="text-muted-foreground text-xs">
          The indices are for plotting position; the quadrant text uses the discrete Low/High labels
          only.
        </p>
      </HelpSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* RQ1                                                                  */
/* ------------------------------------------------------------------ */

export function RQ1CommitsPerWeekBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>Average commit rate over a recent rolling window (not lifetime total / total weeks).</p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Count commits whose timestamp falls in the <strong>last 13 weeks</strong> (~3 months), then
          divide by 13 to get commits per week.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ1LargeCommitRatioBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>Share of commits whose total changed lines (add + delete across files) exceed 500.</p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          From git log with numstat: for each commit, sum add+del lines. Count commits with total &gt;
          500; divide by number of commits.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ1BurstRatioBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          What fraction of commits occur inside <strong>burst clusters</strong> — short windows of
          intense committing.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Sort commits by time. Group consecutive commits if each gap to the next is ≤ 30 minutes.
          A <strong>burst</strong> is any group with at least 3 commits. The ratio is:
        </p>
        <FormulaBox>100 × (commits that belong to some burst group) / (all commits)</FormulaBox>
        <p className="text-muted-foreground text-xs">
          Not the same as &quot;percent of gaps under 30 minutes&quot;; it weights whole bursts.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ1EntropyBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>How irregular the spacing between consecutive commits is (second-order rhythm).</p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Take gaps between consecutive commit timestamps (milliseconds). Compute the sample standard
          deviation of those gaps. Larger values mean more erratic timing; near-zero means very steady
          pacing.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ1DuplicationPercentBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          The fraction of duplicated lines found by <strong>jscpd</strong> clone detection across this
          repository. One number describes the codebase as a whole—use it alongside git habits to spot
          change quality or repetition.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Aggregate duplicated-line percentage from jscpd (same methodology as elsewhere in this
          dashboard). Not derived from git author identity; it stays a <strong>repository-level</strong>{" "}
          snapshot.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ1MedianCommitSizeBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Typical commit size: half of commits are smaller than this total line churn (add + delete),
          half are larger.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          From git history with numstat: per commit, sum added + deleted lines across files. Take the
          median of those totals (git metrics v2).
        </p>
      </HelpSection>
    </>
  );
}

export function RQ1AvgLinesPerCommitBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>Mean total lines changed per commit (add + delete), across all parsed commits.</p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <FormulaBox>avg lines per commit = sum(commit sizes) / number of commits</FormulaBox>
      </HelpSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* RQ3 React / TSX (heuristic benchmarks)                               */
/* ------------------------------------------------------------------ */

export function RQ3ReactFerreiraBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Count of components flagged by a <strong>Ferreira-style</strong> cohesion heuristic: many
          hooks plus a large component body suggests responsibilities mixed together.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          A function that contains JSX is a component. Flag when <strong>hook count &gt; 5</strong>{" "}
          and <strong>component SLOC &gt; 50</strong> (engine thresholds).
        </p>
      </HelpSection>
    </>
  );
}

export function RQ3ReactTampereBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          How many components exceed a <strong>Tampere-style</strong> nested JSX depth limit (deep
          trees are harder to reason about).
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          For each component, measure maximum JSX nesting depth; count components where depth{" "}
          <strong>&gt; 5</strong>.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ3ReactMaxJsxDepthRepoBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>The deepest nested JSX observed in any single component in the analyzed TSX.</p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Across all components, take the maximum of per-component max JSX depth (same depth metric as
          the Tampere flag, without applying the threshold).
        </p>
      </HelpSection>
    </>
  );
}

export function RQ3ReactPropDrillingBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Approximate <strong>prop pass-through</strong> edges: props forwarded toward children
          without local use (same-file minimum viable pattern).
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Heuristic scan in <code className="rounded bg-muted px-1">.tsx</code>: count edges where a
          prop is passed down only to satisfy a child (MVP drill detector in the engine).
        </p>
      </HelpSection>
    </>
  );
}

export function RQ3ReactConditionalHooksBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Violations of the <strong>Rules of Hooks</strong>: hook calls under conditional or loop
          control flow.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Count <code className="rounded bg-muted px-1">use*</code> call sites that appear under{" "}
          <code className="rounded bg-muted px-1">if</code>,{" "}
          <code className="rounded bg-muted px-1">for</code>,{" "}
          <code className="rounded bg-muted px-1">while</code>, or{" "}
          <code className="rounded bg-muted px-1">switch</code> (heuristic AST walk).
        </p>
      </HelpSection>
    </>
  );
}

export function RQ3ReactAsyncUseEffectBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          <code className="rounded bg-muted px-1">useEffect</code> callbacks declared{" "}
          <code className="rounded bg-muted px-1">async</code> — usually a mistake (effect cannot be
          async; encourages floating promises).
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>Count effect registrations whose function is explicitly marked async.</p>
      </HelpSection>
    </>
  );
}

export function RQ3ReactMissingDepsBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Effects or callbacks that use a dependency array form we cannot verify statically (missing
          array or non-literal), so dependency correctness is unclear.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Count <code className="rounded bg-muted px-1">useEffect</code> /{" "}
          <code className="rounded bg-muted px-1">useCallback</code> sites without a literal array
          dependency argument or with patterns the analyzer flags as invalid.
        </p>
      </HelpSection>
    </>
  );
}

export function RQ3ReactNonPrimitiveDepsBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Dependency array entries that are likely to change identity every render (objects, inline
          calls, etc.), which can amplify unnecessary effect runs.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Heuristic: flag dependency slots that are object/array literals or obvious non-primitive
          expressions in the AST.
        </p>
      </HelpSection>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* React per-component table (column glossary)                          */
/* ------------------------------------------------------------------ */

export function ReactTableColComponentBody() {
  return (
    <>
      <HelpSection title="What it is">
        <p>
          Display name of the function-like unit that qualifies as a <strong>component</strong> for
          this row: its body contains at least one JSX element.
        </p>
      </HelpSection>
      <HelpSection title="How it is picked">
        <p>
          Tree-sitter walk: <code className="rounded bg-muted px-1">function_declaration</code>,{" "}
          <code className="rounded bg-muted px-1">const</code> arrow components, etc., where{" "}
          <code className="rounded bg-muted px-1">nodeContainsJsx(body)</code> is true.
        </p>
      </HelpSection>
    </>
  );
}

export function ReactTableColFileBody() {
  return (
    <>
      <HelpSection title="What it is">
        <p>Repository-relative path to the <code className="rounded bg-muted px-1">.tsx</code> file.</p>
      </HelpSection>
      <HelpSection title="Notes">
        <p>Hover or widen the column to see the full path when truncated.</p>
      </HelpSection>
    </>
  );
}

export function ReactTableColLineBody() {
  return (
    <>
      <HelpSection title="What it is">
        <p>
          <strong>1-based</strong> starting line of the component&apos;s function node in that file (
          <code className="rounded bg-muted px-1">startPosition.row + 1</code> in the parser).
        </p>
      </HelpSection>
      <HelpSection title="How to read it">
        <p>Use it to jump to the declaration in your editor; it is not a line count.</p>
      </HelpSection>
    </>
  );
}

export function ReactTableColSlocBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Physical <strong>line span</strong> of the entire function node: from its first line through
          its last line, inclusive (signature + body).
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <FormulaBox>lines = endLine − startLine + 1</FormulaBox>
        <p className="text-muted-foreground text-xs">
          This is the same <code className="rounded bg-muted px-1">lines</code> field used for Ferreira
          thresholds, not a comment-stripped logical LOC.
        </p>
      </HelpSection>
    </>
  );
}

export function ReactTableColHooksBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Number of React hook <strong>calls</strong> in the component body (e.g.{" "}
          <code className="rounded bg-muted px-1">useState</code>,{" "}
          <code className="rounded bg-muted px-1">useEffect</code>).
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Walk call expressions: callee name starts with <code className="rounded bg-muted px-1">use</code>{" "}
          and has length &gt; 3 (filters out plain <code className="rounded bg-muted px-1">use</code>{" "}
          identifiers).
        </p>
      </HelpSection>
    </>
  );
}

export function ReactTableColMaxJsxBody() {
  return (
    <>
      <HelpSection title="What “Δ” means here">
        <p>
          <strong>Max JSX depth</strong> for this component: how deeply{" "}
          <code className="rounded bg-muted px-1">jsx_element</code> /{" "}
          <code className="rounded bg-muted px-1">jsx_self_closing_element</code> nodes nest inside
          the function body (not a diff / delta against a baseline).
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          For each JSX node, compute subtree depth; take the maximum. A depth of 1 is a minimal leaf
          element; nested children increase depth (see engine{" "}
          <code className="rounded bg-muted px-1">maxJsxDepthInSubtree</code>).
        </p>
      </HelpSection>
    </>
  );
}

export function ReactTableColFerreiraBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Whether this row matches the <strong>Ferreira-style</strong> cohesion flag: many hooks and a
          large component body.
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <FormulaBox>
          yes when hookCount &gt; 5 <span className="text-muted-foreground">and</span> lines &gt; 50
        </FormulaBox>
        <p className="text-muted-foreground text-xs">Otherwise the cell shows an em dash (—).</p>
      </HelpSection>
    </>
  );
}

export function ReactTableColTampereBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          Whether this component exceeds the <strong>Tampere-style</strong> nested JSX depth limit (
          deep trees are harder to follow).
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <FormulaBox>yes when max JSX depth &gt; 5</FormulaBox>
        <p className="text-muted-foreground text-xs">
          Matches the summary card &quot;Tampere: JSX depth &gt; 5&quot;; column is per-component.
        </p>
      </HelpSection>
    </>
  );
}

export function ReactTableColDrillBody() {
  return (
    <>
      <HelpSection title="What it measures">
        <p>
          <strong>Prop pass-through</strong> edges in this component: props forwarded toward children
          without local use (same-file MVP drill detector).
        </p>
      </HelpSection>
      <HelpSection title="How it is calculated">
        <p>
          Counts edges from the engine&apos;s{" "}
          <code className="rounded bg-muted px-1">countPropPassThroughEdges</code> heuristic — aligned
          with the &quot;Prop pass-through edges&quot; aggregate card above the table.
        </p>
      </HelpSection>
    </>
  );
}
