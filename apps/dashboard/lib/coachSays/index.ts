export type { CoachSaysFacts } from "./coachSaysFacts";
export {
  allowedCoachPriorityTabs,
  buildCoachSaysFacts,
  buildCoachSaysFallback,
  computeCodeQualityScore,
  computeReactHealthScore,
  computeTestingScore,
  footerLabelForCoachTab,
  healthTierForCoachPriorityTab,
  scrollElementIdForCoachTab,
} from "./coachSaysFacts";
export type { CoachSaysPayload, CoachSaysPriorityTab } from "./coachSaysTypes";
export { clearCoachSaysCache, fetchCoachSays, stableCoachFactsKey } from "./fetchCoachSays";
export { useCoachSays } from "./useCoachSays";
