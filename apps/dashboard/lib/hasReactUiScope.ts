import type { RepoReport } from "./reportTypes";

/** True when the analyzed repo includes .tsx files (React/TSX metrics apply). */
export function hasReactUiScope(report: RepoReport): boolean {
  return (report.profile?.tsxFiles ?? 0) > 0;
}
