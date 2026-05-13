import Link from "next/link";
import type { FormattedRef } from "@/lib/bibtexToRefs";
import { MathBlock } from "@/components/research/MathBlock";
import {
  DescriptivesTable,
  PosthocTable,
  SampleSizesTable,
  StageCorrTable,
} from "@/components/research/PaperTables";
import { Fig1AuAumLineChart } from "@/components/research/charts/Fig1AuAumLineChart";
import { Fig2AuAumScatterChart } from "@/components/research/charts/Fig2AuAumScatterChart";
import { Fig3StageCorrBarChart } from "@/components/research/charts/Fig3StageCorrBarChart";
import { Fig4PlanningHeatmap } from "@/components/research/charts/Fig4PlanningHeatmap";
import { PaperChartFigure } from "@/components/research/charts/PaperChartFigure";
import { InstrumentationSection } from "@/components/research/InstrumentationSection";
import { RepoMetricGrounding } from "@/components/research/RepoMetricGrounding";
import { RESEARCH_CONSTRUCT_ABBREVIATIONS } from "@/components/research/researchConstructAbbreviations";
import { FIG2_META } from "@/lib/research/paperChartData";
import { paperAffiliation, paperAuthors } from "@/lib/paperAuthors";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-border pt-10 first:border-t-0 first:pt-0">
      <h2 className="mb-4 text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function ResearchPaperBody({ bibRefs }: { bibRefs: FormattedRef[] }) {
  return (
    <article className="relative mx-auto min-w-0 w-full max-w-4xl overflow-visible pb-20">
      <header className="mb-10 border-b border-border pb-8">
        <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
          Stage-Aware AI Usage and AI Usage Maturity in Software Engineering Education
        </h1>
        <div className="mt-4 space-y-2 text-sm">
          <ul className="space-y-1.5 text-muted-foreground">
            {paperAuthors.map(({ name, email }) => (
              <li key={email}>
                <span className="font-medium text-foreground">{name}</span>
                {" — "}
                <a href={`mailto:${email}`} className="text-primary underline-offset-4 hover:underline">
                  {email}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground">{paperAffiliation}</p>
        </div>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          Full manuscript reproduced below with embedded figures and tables. Repo-derived tooling sections follow for contributors analyzing coursework repositories with this dashboard.
        </p>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span>
            BibTeX:{" "}
            <Link
              href="/research/paper/refs.bib"
              className="text-primary underline-offset-4 hover:underline"
            >
              refs.bib
            </Link>
          </span>
          <span className="text-muted-foreground/70">
            Keywords: generative AI, software engineering education, AI usage maturity, technology acceptance model,
            software development lifecycle, AI literacy
          </span>
        </p>
      </header>

      <Section id="abstract" title="Abstract">
        <p>
          Generative artificial intelligence (GenAI) tools are rapidly adopted in software engineering education,
          yet many empirical studies treat AI adoption as a single uniform behavior. This paper analyzes how students use and engage with AI across phases of development in an undergraduate software engineering course (
          <em>N</em> = 85). We evaluate <strong className="text-foreground">AI Usage (AU)</strong>, operationalizing TAM&apos;s actual use construct as engagement frequency, and{" "}
          <strong className="text-foreground">AI Usage Maturity (AUM)</strong>, capturing deliberate iterative verification practices across planning, design, implementation, testing, deployment, and maintenance.
          Perceptions are contextualized with the Technology Acceptance Model (TAM).
        </p>
        <p>
          Overall AU and AUM correlate strongly (<span className="font-serif italic">r</span> = 0.690,{" "}
          <span className="font-serif italic">p</span> {"<"} .001). AUM differs significantly across phases (Friedman χ² = 66.13,{" "}
          <span className="font-serif italic">p</span> {"<"} .001): maturity is higher in early/middle phases than later phases, whereas AU stays comparatively flat across phases.
          AU–AUM coupling peaks during planning (<span className="font-serif italic">r</span> = 0.671) and is non-significant during maintenance (
          <span className="font-serif italic">r</span> = 0.164). Findings inform stage-aware instructional scaffolding across the lifecycle.
        </p>
      </Section>

      <Section id="introduction" title="1. Introduction">
        <p>
          GenAI tools reshape SE education—speeding iteration yet risking uncritical adoption (
          <span className="text-muted-foreground/90">
            see Becker et al., Pirzado et al., and related citations below
          </span>
          ). Educators now emphasize <em>how</em> students use AI, but surveys frequently collapse contexts across qualitatively different SDLC tasks.
        </p>
        <p>
          We extend TAM with a <strong className="text-foreground">stage-aware</strong> lens and introduce AUM orthogonal to AU.
          Our research questions mirror the manuscript:
        </p>
        <dl className="space-y-3 rounded-lg border bg-muted/25 px-4 py-3 text-foreground">
          <div>
            <dt className="font-semibold">RQ1</dt>
            <dd>How does AI usage relate to AI usage maturity across SDLC stages?</dd>
          </div>
          <div>
            <dt className="font-semibold">RQ2</dt>
            <dd>How does AI usage maturity vary across SDLC stages?</dd>
          </div>
        </dl>
      </Section>

      <Section id="background" title="2. Background and related work">
        <h3 className="text-base font-semibold text-foreground">2.1 Technology acceptance model</h3>
        <p>
          PEOU and PU predict behavioral intention and actual use in canonical TAM accounts; AI coding assistants reinforce that PU and PEOU remain central in computing classrooms. Extensions incorporate trust, facilitating conditions, and motivation—particularly salient when judging unreliable LLM outputs.
        </p>
        <h3 className="mt-6 text-base font-semibold text-foreground">2.2 AI adoption in SE education</h3>
        <p>
          Students perceive productivity gains yet worry about reliability and dependency. Prior studies often aggregate AI frequency without mapping variation across SDLC phases—exactly the gap our stage-aware framing targets.
        </p>
        <h3 className="mt-6 text-base font-semibold text-foreground">2.3 AI literacy</h3>
        <p>
          Literacy blends technical competence with critique and ethics; these competencies moderate responsible adoption across every lifecycle phase in our framework.
        </p>
        <h3 className="mt-6 text-base font-semibold text-foreground">2.4 Project-based SE courses</h3>
        <p>
          Term-length team projects expose students sequentially to each SDLC phase—matching Raibulet &amp; Arcelli Fontana&apos;s arguments that pedagogical attention must track evolving tooling demands (including GenAI) across requirements through maintenance.
        </p>
      </Section>

      <Section id="model" title="3. Theoretical model and constructs">
        <div
          id="constructs-key"
          className="mb-8 scroll-mt-28 rounded-lg border border-border bg-muted/20 px-4 py-4 sm:px-5 sm:py-5"
        >
          <h3 className="mb-3 text-base font-semibold tracking-tight text-foreground">
            Construct abbreviation key
          </h3>
          <dl className="space-y-4">
            {RESEARCH_CONSTRUCT_ABBREVIATIONS.map((c) => (
              <div key={c.id} id={c.id} className="scroll-mt-28">
                <dt className="font-semibold text-foreground">{c.abbr}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.description}</dd>
              </div>
            ))}
          </dl>
        </div>
        <h3 className="text-base font-semibold text-foreground">3.1 Stage-aware TAM</h3>
        <p>
          PU becomes stage-specific: PU<sub>s</sub> captures usefulness <em>for work at stage s</em>. BI was measured only for Planning; remaining stages emphasize the PU→AU pathway given survey-length constraints.
        </p>
        <h3 className="mt-6 text-base font-semibold text-foreground">3.2 AI Usage Maturity (AUM)</h3>
        <p>
          AUM summarizes iterative prompting, verification behaviors, and contextual alignment—distinct from mere adoption frequency (AU).
        </p>
        <MathBlock displayMode>
          {String.raw`\mathrm{AUM}_s = \frac{1}{3} \sum_{i=1}^{3} D_{is}`}
        </MathBlock>
        <p>Three Likert items per stage instantiate those dimensions with scenario-specific wording.</p>
        <h3 className="mt-6 text-base font-semibold text-foreground">3.3 Relating AU, AUM, and TAM</h3>
        <p>
          Stage-wise correlations reveal whether frequency proxies quality: tight coupling invites instructional shortcuts using observable usage; decoupling implies explicit coaching on interaction patterns.
        </p>
      </Section>

      <Section id="methods" title="4. Methods">
        <h3 className="text-base font-semibold text-foreground">4.1 Participants and context</h3>
        <p>
          Two undergraduate SE courses at a public research university contributed Qualtrics surveys spanning team-based projects touching all six SDLC phases. After cleaning, <em>N</em> = 85 responses remained. Students were experienced with programming (80% report ≥3 years) and GenAI (89% weekly+ usage), primarily Claude or ChatGPT—highlighting mature adoption rather than onboarding noise.
        </p>
        <h3 className="mt-6 text-base font-semibold text-foreground">4.2 Differential response rates</h3>
        <p>
          Planning &amp; Implementation attracted complete responses (85 each); later phases exhibit missingness (Table 1). Forty-one percent completed every stage. Planning-stage AU/AUM did not differ between completers vs. drop-offs (<span className="font-serif italic">p</span> {" > "} .10), supporting MCAR assumptions for exploratory analyses; complete-case subsets use{" "}
          <em>N</em> = 35 (AU) or <em>N</em> = 48 (AUM) where noted below.
        </p>
        <SampleSizesTable />
        <h3 className="mt-6 text-base font-semibold text-foreground">4.3 Survey instrument</h3>
        <p>
          Five-point Likert scales captured PEOU, PU, AU (plus BI at Planning). AU items followed standard TAM wording per stage; AUM triplets emphasized iterative refinement, verification, and contextual grounding; AI literacy &amp; facilitating conditions aggregated global items via row means.
        </p>
        <h3 className="mt-6 text-base font-semibold text-foreground">4.4 Analysis</h3>
        <p>
          Python (<code className="rounded bg-muted px-1">pandas</code>, <code className="rounded bg-muted px-1">scipy.stats</code>) supplied descriptive statistics, Pearson correlations, Cronbach&apos;s α for AUM composites, Friedman tests for repeated measures across stages, and Bonferroni-adjusted Wilcoxon post-hocs.
        </p>
      </Section>

      <Section id="results" title="5. Results">
        <h3 className="text-base font-semibold text-foreground">5.1 AUM reliability</h3>
        <p>
          Three-item AUM scales ranged α = .665–.897—acceptable for exploratory composites—with higher consistency where workflows were routinized (Planning, Maintenance) vs. opportunistic stages (Design, Deployment).
        </p>
        <h3 className="mt-6 scroll-mt-24 text-base font-semibold text-foreground sm:scroll-mt-28">5.2 AU and AUM across stages (RQ2)</h3>
        <DescriptivesTable />
        <PaperChartFigure
          figNum={1}
          caption="Mean AU and AUM (±1 SE) across SDLC stages. AUM drops after Implementation while AU remains comparatively flat."
        >
          <Fig1AuAumLineChart />
        </PaperChartFigure>
        <p>
          Friedman tests on the complete-case subsample showed a massive stage effect on AUM (χ²(5) = 66.13,{" "}
          <span className="font-serif italic">p</span> {"<"} .001). Post-hoc comparisons produced high vs. low maturity clusters (Planning/Design/Implementation vs. Testing/Deployment/Maintenance).
        </p>
        <PosthocTable />
        <p>
          By contrast, AU showed no significant dispersion across stages for the matched subsample (χ²(5) = 5.04,{" "}
          <span className="font-serif italic">p</span> = .41)—underscoring divergence between frequency and quality.
        </p>
        <h3 className="mt-6 scroll-mt-24 text-base font-semibold text-foreground sm:scroll-mt-28">5.3 Overall AU–AUM relationship (RQ1)</h3>
        <PaperChartFigure
          figNum={2}
          figureClassName="mx-auto max-w-lg"
          caption={
            <>
              Overall AU vs AUM with regression line and 95% confidence band (
              <span className="font-serif italic">r</span> = 0.690, <span className="font-serif italic">p</span> {"<"}{" "}
              .001, <span className="font-serif italic">N</span> = 85).
            </>
          }
          captionFootnote={FIG2_META.subtitle}
        >
          <Fig2AuAumScatterChart />
        </PaperChartFigure>
        <p>
          Stage-level Pearson correlations (Figure 3 &amp; Table 4) reveal heterogeneous coupling: Planning, Implementation, and Deployment exhibit significant AU–AUM alignment; Design, Testing, and Maintenance do not.
        </p>
        <PaperChartFigure
          figNum={3}
          caption={
            <>
              Stage-level AU–AUM correlations. Dark bars denote <span className="font-serif italic">p</span> {"<"}{" "}
              .05; light bars are non-significant.
            </>
          }
        >
          <Fig3StageCorrBarChart />
        </PaperChartFigure>
        <StageCorrTable />
        <h3 className="mt-6 text-base font-semibold text-foreground">5.4 PU→AU pathways</h3>
        <p>
          PU predicts AU at every stage (<span className="font-serif italic">p</span> {"<"} .01), yet effect sizes attenuate during Testing and Deployment—suggesting habitual or convenience-driven usage once usefulness judgments plateau.
        </p>
        <h3 className="mt-6 scroll-mt-24 text-base font-semibold text-foreground sm:scroll-mt-28">5.5 TAM constructs &amp; antecedents</h3>
        <p>
          Planning-stage correlations reproduce classical TAM structure (e.g., PU–BI ≈ .88). Planning AU predicts lifecycle AU (<span className="font-serif italic">r</span> = .80). AI literacy aligns more closely with AUM than AU; facilitating conditions barely predict AU—consistent with universal tool access in this cohort.
        </p>
        <PaperChartFigure
          figNum={4}
          caption="Correlation matrix for Planning-stage TAM constructs, AI literacy, facilitating conditions, and overall AU/AUM."
          captionFootnote="Full pairwise Pearson correlations; shading uses a manuscript-style warm sequential ramp (cream / pale yellow through deep coral-red) matched to conventional YlOrRd-style heatmaps (weak → strong association)."
        >
          <Fig4PlanningHeatmap />
        </PaperChartFigure>
      </Section>

      <Section id="discussion" title="6. Discussion">
        <p>
          Heterogeneous AU–AUM coupling implies instructors cannot rely on coarse adoption metrics—stage-specific scaffolding is necessary. High maturity clusters concentrate upstream in the lifecycle; later phases demand deliberate prompts tying AI suggestions to tests, CI evidence, and verification rituals.
        </p>
        <p className="font-medium text-foreground">Instructional priorities highlighted in the manuscript:</p>
        <ol className="list-inside list-decimal space-y-2">
          <li>Seed mature AI habits during Planning—strong PU→AU and AU–AUM alignment.</li>
          <li>Restructure late-phase assignments so frequency alone cannot substitute for disciplined critique.</li>
          <li>Differentiate literacy supports now that infrastructure saturation removes variance from facilitating conditions.</li>
        </ol>
      </Section>

      <Section id="limitations" title="7. Limitations and future work">
        <p>
          Self-reports invite bias; single-item AU limits reliability; single-institution AI-fluent cohorts constrain generalizability; teams violate independence assumptions; missingness persists despite MCAR diagnostics.
        </p>
        <p>
          Future studies should triangulate with repository traces (like those exported from this dashboard), model longitudinal evolution of AUM, and evaluate instructional interventions targeting Testing–Maintenance valleys.
        </p>
      </Section>

      <Section id="conclusion" title="8. Conclusion">
        <p>
          Stage-aware measurement exposes divergent stories for AI frequency vs. maturity across SDLC phases. Educators obtain actionable hooks—Planning as leverage point, late phases as maturity deficits—without assuming uniform adoption dynamics.
        </p>
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">AI disclosure</p>
          <p className="mt-1">
            Claude (Anthropic) assisted drafting portions of the manuscript and analysis scripts, per the camera-ready acknowledgements.
          </p>
        </div>
      </Section>

      <InstrumentationSection />
      <RepoMetricGrounding />

      <section id="references" className="scroll-mt-28 border-t border-border pt-10">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">References</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Auto-formatted from the project BibTeX bundle (alphabetical by citation key). Download the raw database for BibLaTeX/Biber workflows.
        </p>
        <ol className="list-inside list-decimal space-y-3 text-sm leading-relaxed text-muted-foreground">
          {bibRefs.map((ref) => (
            <li key={ref.key} id={`ref-${ref.key}`} className="pl-1 marker:text-foreground">
              {ref.line}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
