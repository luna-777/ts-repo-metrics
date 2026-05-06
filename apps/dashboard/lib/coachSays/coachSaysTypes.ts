import type { CoachPriorityTabId } from "@/lib/resultsNavigation";

export type CoachSaysPriorityTab = CoachPriorityTabId;

export interface CoachSaysPayload {
  strengthText: string;
  opportunityText: string;
  pointerText: string;
  priorityTab: CoachSaysPriorityTab;
  footerLabel: string;
}
