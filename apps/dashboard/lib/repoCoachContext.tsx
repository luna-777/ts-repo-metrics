"use client";

import { createContext, useContext } from "react";

/** Opens the repo coach chat and sends a user message (for section explainer shortcuts). */
export type CoachExplainFn = (userMessage: string) => void;

const CoachExplainContext = createContext<CoachExplainFn | null>(null);

export function CoachExplainProvider({
  value,
  children,
}: {
  value: CoachExplainFn;
  children: React.ReactNode;
}) {
  return (
    <CoachExplainContext.Provider value={value}>{children}</CoachExplainContext.Provider>
  );
}

export function useCoachExplain(): CoachExplainFn | null {
  return useContext(CoachExplainContext);
}
