/**
 * Canonical abbreviations used in the research manuscript figures, tables, and prose.
 * Keeps sidebar glossary and in-paper Construct key in sync.
 */
export interface ResearchConstructAbbrev {
  /** Stable fragment for deep links (#abbr-au etc.) */
  id: string;
  /** Bold label shown in glossary and TOC */
  abbr: string;
  /** Plain-language gloss (sentence fragment or short sentence). */
  description: string;
}

export const RESEARCH_CONSTRUCT_ABBREVIATIONS: readonly ResearchConstructAbbrev[] = [
  {
    id: "abbr-genai",
    abbr: "GenAI",
    description: "Generative artificial intelligence—the LLM-assisted coding and writing tools students reported using.",
  },
  {
    id: "abbr-tam",
    abbr: "TAM",
    description: "Technology Acceptance Model—the perception → behavioral intention → use framework; extended here stage-by-stage.",
  },
  {
    id: "abbr-peou",
    abbr: "PEOU",
    description: "Perceived Ease of Use—students’ judgments of how effortless AI tools feel for work at each SDLC phase.",
  },
  {
    id: "abbr-pu",
    abbr: "PU",
    description: "Perceived Usefulness—how valuable students judge AI assistants for tasks at each SDLC stage.",
  },
  {
    id: "abbr-bi",
    abbr: "BI",
    description: "Behavioral Intention to use AI (Planning phase only)—likelihood/plans to rely on assistants for planning-stage work.",
  },
  {
    id: "abbr-au",
    abbr: "AU",
    description: "AI Usage—Likert-derived frequency/intensity of GenAI engagement (TAM-style “actual use”) measured per SDLC stage.",
  },
  {
    id: "abbr-aum",
    abbr: "AUM",
    description: "AI Usage Maturity—composite of iterative refinement, verification, and contextual grounding prompts per phase.",
  },
  {
    id: "abbr-sdlc",
    abbr: "SDLC",
    description: "Software Development Lifecycle phases (Planning→Design→Implementation→Testing→Deployment→Maintenance) in coursework.",
  },
  {
    id: "abbr-rq1",
    abbr: "RQ1",
    description: "Research question—how AU relates to AUM overall and stage-by-stage.",
  },
  {
    id: "abbr-rq2",
    abbr: "RQ2",
    description: "Research question—how AUM differs across SDLC stages versus flat AU dispersion.",
  },
  {
    id: "abbr-ai-lit",
    abbr: "AI lit.",
    description: "AI literacy—a global composite indexing competence, critique, and responsible/adaptive use attitudes.",
  },
  {
    id: "abbr-facil",
    abbr: "Facil.",
    description: "Facilitating Conditions—Tan et al.’s infrastructural/policy support latent construct aggregated from global items.",
  },
  {
    id: "abbr-mcar",
    abbr: "MCAR",
    description: "Missing Completely At Random—informal exploratory assumption that drop-offs do not bias Planning AU/AUM means.",
  },
] as const;
