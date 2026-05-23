export interface RubricDefinition {
  keys: string[];
  prompt: string;
}

export const RUBRICS: Record<string, RubricDefinition> = {
  release_plan: {
    keys: [
      "heading_complete",
      "high_level_goals_present",
      "user_stories_present",
      "user_stories_format",
      "story_points_present",
      "sprint_assignment_present",
      "unique_story_ids",
      "priority_indicated",
      "product_backlog_present",
      "capacity_check_present",
    ],
    prompt: `
Checklist criteria — evaluate each independently:
- heading_complete: Heading contains all of: document name, product name, team name,
  release name, release date, revision number, revision date (6+ fields)
- high_level_goals_present: At least one concrete high-level goal is described
- user_stories_present: At least one user story is listed
- user_stories_format: User stories follow "As a {role}, I want {goal}" format
- story_points_present: Each user story has a story point estimate
- sprint_assignment_present: Each user story is assigned to a specific sprint (Sprint 1, Sprint 2, etc.)
- unique_story_ids: User stories have unique labels or identifiers (US-1, 1.1, etc.)
- priority_indicated: Priority is shown either by ordering or explicit label
- product_backlog_present: A product backlog section exists listing stories not in this release
- capacity_check_present: There is mention of team capacity, velocity estimate, or sanity
  check of total story points against team capacity
    `.trim(),
  },

  sprint_plan: {
    keys: [
      "heading_complete",
      "sprint_goal_present",
      "user_stories_present",
      "user_stories_format",
      "tasks_under_stories",
      "time_estimates_present",
      "estimates_within_6h",
      "story_totals_present",
      "team_roles_listed",
      "initial_task_assignment",
      "scrum_times_listed",
      "ta_visit_indicated",
    ],
    prompt: `
Checklist criteria:
- heading_complete: Heading contains document name ("Sprint N Plan"), product name,
  team name, sprint completion date, revision number, revision date
- sprint_goal_present: A sprint goal section exists with 1–2 sentences describing the objective
- user_stories_present: At least one user story is listed
- user_stories_format: Stories follow "As a {role}, I want {goal}" format
- tasks_under_stories: Each user story has at least one task listed beneath it
- time_estimates_present: Time estimates are provided for individual tasks
- estimates_within_6h: All individual task time estimates are 6 ideal hours or less
  (mark false if any single task estimate exceeds 6 hours)
- story_totals_present: Total hours per user story are summed and listed
- team_roles_listed: All team members are listed with at least one role each
- initial_task_assignment: Each team member is assigned an initial user story and task
- scrum_times_listed: At least 3 scheduled scrum meeting days and times are listed
- ta_visit_indicated: One of the scrum times is identified as the TA/tutor visit
    `.trim(),
  },

  sprint_report: {
    keys: [
      "heading_complete",
      "stop_section_present",
      "stop_has_explanations",
      "start_section_present",
      "start_has_explanations",
      "keep_section_present",
      "keep_has_explanations",
      "completed_stories_listed",
      "incomplete_stories_listed",
      "velocity_metrics_present",
      "velocity_rates_present",
      "cumulative_velocity_present",
      "burnup_chart_present",
    ],
    prompt: `
Checklist criteria:
- heading_complete: Heading contains document name ("Sprint N Report"), product name,
  team name, date
- stop_section_present: An "actions to stop doing" section exists
- stop_has_explanations: Each stop item has both a description AND a reason/explanation
- start_section_present: An "actions to start doing" section exists
- start_has_explanations: Each start item has both a description AND a reason/explanation
- keep_section_present: An "actions to keep doing" section exists
- keep_has_explanations: Each keep item has both a description AND a reason/explanation
- completed_stories_listed: A list of user stories completed during the sprint is present
- incomplete_stories_listed: Stories that were planned but not completed are listed,
  OR there is an explicit statement that all planned stories were completed
- velocity_metrics_present: total stories completed, total ideal hours completed, total sprint days
- velocity_rates_present: Stories/day and hours/day rates are explicitly stated
- cumulative_velocity_present: For sprint 2+ cumulative averages reported; true for sprint 1
- burnup_chart_present: A burnup or burndown chart is included or referenced as attachment
    `.trim(),
  },

  test_plan: {
    keys: [
      "heading_complete",
      "scenarios_present",
      "scenarios_reference_stories",
      "scenarios_have_steps",
      "scenarios_have_inputs",
      "scenarios_have_expected_output",
      "scenarios_have_pass_fail",
      "unit_tests_referenced",
      "unit_test_results_noted",
    ],
    prompt: `
Checklist criteria:
- heading_complete: Heading contains "Test Plan and Report", product name, team name, date
- scenarios_present: At least one system test scenario is described
- scenarios_reference_stories: Scenarios linked to user stories
- scenarios_have_steps: Each scenario has numbered step-by-step interactions
- scenarios_have_inputs: Steps include specific inputs or placeholders like <username>
- scenarios_have_expected_output: Each scenario states expected system behavior
- scenarios_have_pass_fail: Each scenario marked Pass or Fail
- unit_tests_referenced: Unit test section references directory, file, or framework
- unit_test_results_noted: Pass/fail status of unit tests is noted
    `.trim(),
  },
};

export const STRUCTURED_DOC_TYPES = new Set([
  "release_plan",
  "sprint_plan",
  "sprint_report",
  "test_plan",
]);

export const HOLISTIC_DOC_TYPES = new Set([
  "definition_of_done",
  "code_standards",
]);

export const DOD_CONTEXT = `
This is a Definition of Done document. It should define criteria for:
1. When a user story is considered done
2. When a task is considered done
Good criteria are specific and testable. Vague criteria like "quality is good" are less useful.
`.trim();

export function codeStandardsContext(detectedLanguages: string[]): string {
  return `
This is a coding standards document.
The repository uses: ${detectedLanguages.join(", ") || "unknown languages"}.
Good standards are specific and enforceable (e.g. "use ESLint with airbnb config")
rather than vague (e.g. "write clean code").
`.trim();
}
