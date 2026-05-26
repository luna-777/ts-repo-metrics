"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, HelpCircle, Loader2, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ClassifiedDoc,
  DocReviewResult,
  DocumentReview,
} from "@/lib/docReview/types";
import type { RepoReport } from "@/lib/reportTypes";

// ---------------------------------------------------------------------------
// Types & interfaces
// ---------------------------------------------------------------------------

interface DocReviewTabProps {
  resultId: string;
  report: RepoReport;
}

// ---------------------------------------------------------------------------
// Required documents manifest
// ---------------------------------------------------------------------------

const REQUIRED_DOCS = [
  { label: "Release Plan",       filename: "release-plan.md",        docType: "release_plan",       sprintNumber: null },
  { label: "Sprint 1 Plan",      filename: "sprint-1-plan.md",       docType: "sprint_plan",        sprintNumber: 1 },
  { label: "Sprint 2 Plan",      filename: "sprint-2-plan.md",       docType: "sprint_plan",        sprintNumber: 2 },
  { label: "Sprint 3 Plan",      filename: "sprint-3-plan.md",       docType: "sprint_plan",        sprintNumber: 3 },
  { label: "Sprint 4 Plan",      filename: "sprint-4-plan.md",       docType: "sprint_plan",        sprintNumber: 4 },
  { label: "Sprint 1 Report",    filename: "sprint-1-report.md",     docType: "sprint_report",      sprintNumber: 1 },
  { label: "Sprint 2 Report",    filename: "sprint-2-report.md",     docType: "sprint_report",      sprintNumber: 2 },
  { label: "Sprint 3 Report",    filename: "sprint-3-report.md",     docType: "sprint_report",      sprintNumber: 3 },
  { label: "Sprint 4 Report",    filename: "sprint-4-report.md",     docType: "sprint_report",      sprintNumber: 4 },
  { label: "Test Plan",          filename: "test-plan.md",           docType: "test_plan",          sprintNumber: null },
  { label: "Definition of Done", filename: "definition-of-done.md",  docType: "definition_of_done", sprintNumber: null },
  { label: "Code Standards",     filename: "code-standards.md",      docType: "code_standards",     sprintNumber: null },
] as const;

// ---------------------------------------------------------------------------
// Checklist explanations
// ---------------------------------------------------------------------------

const CHECKLIST_EXPLANATIONS: Record<string, string> = {
  // Sprint Plan
  heading_complete: "Your document heading should include: document name (e.g. 'Sprint 1 Plan'), product name, team name, sprint completion date, revision number, and revision date.",
  sprint_goal_present: "A sprint goal is 1–2 sentences describing what the team aims to achieve this sprint. It gives the team a shared objective.",
  user_stories_present: "At least one user story must be listed. User stories describe features from the user's perspective.",
  user_stories_format: "Every story must follow: 'As a [role], I want [goal] so that [reason]'. This format keeps the focus on user value.",
  user_stories_valuable: "Stories must describe user-facing actions, not technical tasks. 'As a developer, I want to set up the database' is a technical task — not a valid user story.",
  no_epic_stories: "Each story must be completable within a single sprint. Stories too large to finish in one sprint are 'epics' and must be broken into smaller stories.",
  acceptance_criteria_present: "Each user story needs at least 2 specific, testable criteria that define when the story is complete. Vague criteria like 'feature works correctly' do not count.",
  tasks_under_stories: "Each user story must be broken down into smaller development tasks listed beneath it.",
  task_descriptions_specific: "Tasks must use an action verb and name a specific deliverable, e.g. 'Code login API endpoint (4h)'. Vague tasks like 'Backend work' or 'Do stuff' do not pass.",
  time_estimates_present: "Each task must have an ideal hour estimate, e.g. '(4h)' or '4 hours'.",
  estimates_within_6h: "No single task should exceed 6 ideal hours. Tasks larger than 6h must be broken into smaller tasks.",
  story_totals_present: "The total estimated hours for each user story should be summed and shown, e.g. 'Total: 14h'.",
  capacity_reserved: "Teams must reserve ~15% of their capacity as a buffer. Committing 100% of available hours with no buffer does not pass.",
  team_roles_listed: "All team members must be listed with at least one Scrum role (Product Owner, Scrum Master, Developer).",
  initial_task_assignment: "Each team member must be assigned an initial user story and task at sprint start.",
  scrum_times_listed: "At least 3 scheduled Scrum meeting days and times must be listed.",
  ta_visit_indicated: "One of the scheduled Scrum meetings must be labeled as the TA or tutor visit.",
  // Sprint Report
  stop_section_present: "A section listing actions the team has decided to stop doing (part of the Start/Stop/Continue retrospective format).",
  stop_has_explanations: "Each 'stop doing' item needs both a description of what to stop AND a reason explaining why.",
  start_section_present: "A section listing new actions the team will start doing going forward.",
  start_has_explanations: "Each 'start doing' item needs both a description of what to start AND a reason explaining why.",
  keep_section_present: "A section listing actions the team will continue doing because they are working well.",
  keep_has_explanations: "Each 'keep doing' item needs both a description of what to continue AND a reason explaining why.",
  completed_stories_listed: "A list of user stories that were fully completed during the sprint.",
  incomplete_stories_listed: "Stories that were planned but not completed, OR an explicit statement that all planned stories were completed.",
  velocity_metrics_present: "Report total stories completed, total ideal hours completed, and total sprint days.",
  velocity_rates_present: "Calculate and state stories per day and hours per day rates explicitly.",
  cumulative_velocity_present: "For Sprint 2+, report cumulative averages across all sprints to date. This criterion is automatically met for Sprint 1.",
  burnup_chart_present: "Include or reference a burnup or burndown chart showing progress over the sprint. An image reference like ![chart](burnup.png) is sufficient.",
  burnup_data_present: "Include a day-by-day table of completed ideal hours for each sprint day. This enables data analysis independent of the chart image.",
  // Release Plan
  high_level_goals_present: "At least one concrete high-level goal for the release must be described.",
  story_points_present: "Each user story must have a story point estimate using Fibonacci numbers (1, 2, 3, 5, 8, 13...).",
  sprint_assignment_present: "Each user story must be assigned to a specific sprint (Sprint 1, Sprint 2, etc.).",
  unique_story_ids: "User stories must have unique identifiers such as US-1, US-2, or 1.1, 1.2, etc.",
  priority_indicated: "Stories must show priority either by order (highest priority first) or explicit label (High/Medium/Low, MoSCoW).",
  product_backlog_present: "A product backlog section listing stories not included in this release.",
  capacity_check_present: "A mention of team capacity, velocity estimate, or sanity check of total story points against team capacity.",
  // Test Plan
  scenarios_present: "At least one system test scenario must be described.",
  scenarios_reference_stories: "Each scenario must be linked to one or more user story IDs.",
  scenarios_have_steps: "Each scenario must have numbered step-by-step interactions (Given/When/Then or equivalent).",
  scenarios_have_inputs: "Steps must include specific inputs or placeholders like <username> or <email>.",
  scenarios_have_expected_output: "Each scenario must state the expected system behavior (the 'Then' part).",
  scenarios_have_pass_fail: "Each scenario must be marked Pass or Fail based on actual test execution.",
  unit_tests_referenced: "The document must reference a unit test directory, file, or testing framework.",
  unit_test_results_noted: "The pass/fail status of the unit test suite must be noted.",
};

// ---------------------------------------------------------------------------
// Document templates
// ---------------------------------------------------------------------------

const DOC_TEMPLATES: Record<string, { example: string; guide: string }> = {
  sprint_plan: {
    example: `# Sprint 1 Plan
**Product:** Campus Event App | **Team:** Team Rocket | **Due:** May 15, 2026 | **Rev:** 1.0 | **Rev Date:** Apr 28, 2026

## Sprint Goal
Deliver user authentication and event browsing so students can log in and view upcoming campus events.

## Team Capacity
- Total available hours: 80h (4 members × 20h/sprint)
- Buffer (15%): 12h
- Committed hours: 68h

## Team Roles
| Member | Role |
|--------|------|
| Alice Chen | Scrum Master |
| Bob Kim | Product Owner |
| Carol Davis | Developer |
| Dan Lee | Developer |

## User Stories

### US-1: As a student, I want to log in with my university email so that I can access personalized event recommendations.
**Acceptance Criteria:**
1. Login redirects to dashboard on success
2. Invalid credentials show error message "Invalid email or password"
3. Session persists across page refreshes

| Task | Assignee | Hours |
|------|----------|-------|
| Design login UI mockup | Alice | 2h |
| Code login API endpoint | Carol | 4h |
| Write unit tests for auth service | Dan | 3h |
| Integrate OAuth with university SSO | Carol | 6h |
| **Story Total** | | **15h** |

### US-2: As a student, I want to browse upcoming events by category so that I can find events relevant to my interests.
**Acceptance Criteria:**
1. Events display with title, date, location, and category
2. Filter by category updates results without page reload
3. Empty state shown when no events match filter

| Task | Assignee | Hours |
|------|----------|-------|
| Design event card component | Bob | 3h |
| Code events API with category filter | Dan | 5h |
| Implement frontend filter UI | Carol | 4h |
| Write integration tests | Alice | 3h |
| **Story Total** | | **15h** |

### US-3: As a student, I want to save events to my calendar so that I don't forget events I'm interested in.
**Acceptance Criteria:**
1. "Save" button appears on each event card
2. Saved events appear in "My Events" section
3. User can remove saved events

| Task | Assignee | Hours |
|------|----------|-------|
| Code saved events data model | Dan | 3h |
| Build save/unsave API endpoints | Carol | 4h |
| Add My Events UI section | Bob | 5h |
| **Story Total** | | **12h** |

**Total committed: 42h of 68h available (includes buffer)**

## Scrum Schedule
| Day | Time | Type |
|-----|------|------|
| Monday | 10:00 AM | Daily Scrum |
| Wednesday | 10:00 AM | Daily Scrum |
| Thursday | 2:00 PM | TA Visit |
| Friday | 10:00 AM | Daily Scrum |`,
    guide: `## How to write a strong Sprint Plan

**From the course slides (Scrum planning execution review):**

### 1. Heading
Include: document name, product name, team name, sprint completion date, revision number, and revision date. All six fields are required.

### 2. Sprint Goal
Write 1–2 sentences describing what the team will accomplish this sprint. A good sprint goal gives the team a shared objective beyond just completing a task list.

### 3. Team Capacity & Buffer
Calculate total available hours, subtract a 15% buffer, and commit only to the remaining hours. This buffer absorbs estimation errors and interruptions.

### 4. User Stories
Every story must follow: **"As a [role], I want [goal] so that [reason]"**

**INVEST criteria (required):**
- **Independent** — not dependent on another story
- **Valuable** — describes user benefit, not a technical task
- **Estimatable** — team can estimate the effort
- **Small** — completable within one sprint (no epics)
- **Testable** — has verifiable acceptance criteria

### 5. Acceptance Criteria
Every story needs at least 2 specific, testable criteria. Write them as concrete pass/fail conditions, not vague goals.

### 6. Task Breakdown
Decompose each story into tasks. Each task must:
- Use an action verb + specific deliverable ("Code login API", not "Backend work")
- Have an hour estimate ≤ 6 ideal hours
- Be assigned to a team member

### 7. Scrum Schedule
List at least 3 meeting times with day, time, and type. One meeting must be labeled as the TA visit.`,
  },

  sprint_report: {
    example: `# Sprint 1 Report
**Product:** Campus Event App | **Team:** Team Rocket | **Date:** May 15, 2026

## Retrospective: Start / Stop / Continue

### Stop Doing
| Action | Reason |
|--------|--------|
| Pushing code directly to main | Caused two merge conflicts that cost 3h to resolve |
| Skipping daily standups on Fridays | Team lost sync on end-of-week work |

### Start Doing
| Action | Reason |
|--------|--------|
| Using feature branches with pull requests | Protects main branch and enables code review |
| Posting async standup updates in Slack when meeting is missed | Keeps everyone informed without requiring sync time |

### Keep Doing
| Action | Reason |
|--------|--------|
| Pair programming on complex tasks | Caught 3 bugs before they reached review |
| Breaking stories into sub-6h tasks | Made estimation more accurate |

## Sprint Outcomes

### Completed Stories
- US-1: Student login with university email ✅
- US-2: Browse events by category ✅

### Incomplete Stories
- US-3: Save events to calendar — moved to Sprint 2 (underestimated OAuth complexity)

## Velocity

| Metric | Value |
|--------|-------|
| Stories completed | 2 |
| Ideal hours completed | 30h |
| Sprint days | 10 |
| Stories/day | 0.2 |
| Hours/day | 3.0h |

## Burnup Chart

![Sprint 1 Burnup Chart](burnup-sprint1.png)

### Daily Progress Data

| Sprint Day | Completed Hours | Ideal Hours |
|-----------|----------------|-------------|
| Day 1 | 0h | 3h |
| Day 2 | 4h | 6h |
| Day 3 | 8h | 9h |
| Day 4 | 12h | 12h |
| Day 5 | 14h | 15h |
| Day 6 | 18h | 18h |
| Day 7 | 22h | 21h |
| Day 8 | 26h | 24h |
| Day 9 | 28h | 27h |
| Day 10 | 30h | 30h |`,
    guide: `## How to write a strong Sprint Report

**From the course slides (Scrum planning execution review):**

### 1. Retrospective (Start / Stop / Continue)
The retrospective captures what the team learned. For each item in all three sections:
- State what the action is clearly
- Explain WHY — the reason behind the decision
A retrospective with items but no reasons is incomplete.

### 2. Sprint Outcomes
List completed and incomplete stories separately. If all stories were completed, state that explicitly. For incomplete stories, note why they were not finished.

### 3. Velocity Metrics
Report: stories completed, ideal hours completed, sprint days, stories/day, hours/day. For Sprint 2+, also report cumulative averages across all sprints.

### 4. Burnup Chart
The burnup chart shows total completed work vs. the ideal trend line over the sprint. The Scrum Master should update it after each daily Scrum. Include both:
- The chart image
- A day-by-day data table (so the data is readable even if the image is missing)`,
  },

  release_plan: {
    example: `# Release Plan
**Product:** Campus Event App | **Team:** Team Rocket | **Release:** v1.0 | **Release Date:** June 20, 2026 | **Rev:** 1.0 | **Rev Date:** Apr 1, 2026

## High-Level Goals
1. Students can discover and save campus events through a mobile-friendly web app
2. Event organizers can create and manage event listings
3. System supports 500 concurrent users at launch

## User Stories

| ID | User Story | Story Points | Priority | Sprint |
|----|-----------|--------------|----------|--------|
| US-1 | As a student, I want to log in with my university email so that I can access personalized recommendations | 5 | High | 1 |
| US-2 | As a student, I want to browse events by category so that I can find relevant events | 3 | High | 1 |
| US-3 | As a student, I want to save events to my calendar so that I don't forget them | 3 | High | 1 |
| US-4 | As an organizer, I want to create event listings so that students can discover my events | 8 | High | 2 |
| US-5 | As an organizer, I want to edit and cancel events so that listings stay accurate | 5 | Medium | 2 |
| US-6 | As a student, I want to receive email reminders for saved events | 5 | Medium | 3 |
| US-7 | As an admin, I want to moderate event listings so that inappropriate content is removed | 8 | Medium | 3 |
| US-8 | As a student, I want to share events on social media | 3 | Low | 4 |

**Total story points:** 40 | **Team velocity estimate:** 12 pts/sprint | **Sprints needed:** ~4 ✅

## Product Backlog (not in this release)
- US-9: Native mobile app (iOS/Android)
- US-10: Event ticketing and payment integration
- US-11: Analytics dashboard for organizers`,
    guide: `## How to write a strong Release Plan

**From the course slides (Intro to Scrum):**

### 1. Heading
Include all six fields: document name, product name, team name, release name, release date, revision number, revision date.

### 2. High-Level Goals
State 2–3 concrete goals for the release. These should describe what the product will do for users, not technical milestones.

### 3. User Stories
Every story needs:
- A unique ID (US-1, US-2...)
- "As a [role], I want [goal]" format
- Story point estimate (use Fibonacci: 1, 2, 3, 5, 8, 13)
- Priority (High/Medium/Low or MoSCoW)
- Sprint assignment

### 4. Capacity Check
Verify total story points fit within the team's sprint capacity. If estimated velocity × number of sprints ≥ total points, the plan is feasible.

### 5. Product Backlog
List user stories that exist but are NOT in this release. This shows the team has thought beyond the current scope.`,
  },

  test_plan: {
    example: `# Test Plan and Report
**Product:** Campus Event App | **Team:** Team Rocket | **Date:** May 15, 2026

## System Test Scenarios

### Scenario 1 — Student Login (US-1)
**Given** a registered student with email \`student@ucsc.edu\` and password \`TestPass123!\`
**When** they submit the login form
**Then** they are redirected to the dashboard and their name appears in the navigation bar

**Result: Pass ✅**

---

### Scenario 2 — Invalid Login (US-1)
**Given** a user enters an incorrect password \`wrongpassword\`
**When** they submit the login form
**Then** an error message "Invalid email or password" is displayed and they remain on the login page

**Result: Pass ✅**

---

### Scenario 3 — Browse Events by Category (US-2)
**Given** a logged-in student on the events page
**When** they select the category \`Academic\` from the filter dropdown
**Then** only events tagged as Academic are displayed and the count updates to reflect the filtered results

**Result: Pass ✅**

---

### Scenario 4 — Save Event (US-3)
**Given** a logged-in student viewing an event with ID \`<event_id>\`
**When** they click the "Save Event" button
**Then** the event appears in their "My Events" section and the button changes to "Saved"

**Result: Fail ❌** — Event saves to database but UI does not update without page refresh (bug filed: #42)

---

## Unit Tests

Unit tests are located in \`/tests/unit/\` using the **Jest** framework with React Testing Library.

| Test Suite | Tests Run | Passed | Failed |
|-----------|-----------|--------|--------|
| AuthService | 12 | 12 | 0 |
| EventController | 8 | 7 | 1 |
| UserModel | 6 | 6 | 0 |
| **Total** | **26** | **25** | **1** |

Failing test: \`EventController > filterByCategory > handles empty results\` — assertion error on empty array shape.`,
    guide: `## How to write a strong Test Plan

**From the course slides (Quality Assurance Concepts Basics + Agile development practices):**

### 1. System Test Scenarios
Each scenario tests the system as a black box from the user's perspective.

Every scenario must include:
- **Given** — the starting state and any required preconditions
- **When** — the specific user action being tested
- **Then** — the expected system behavior
- **Result** — actual Pass or Fail (with honest recording)
- A reference to the user story it tests (US-1, US-2...)
- Specific inputs — use real values or explicit placeholders like \`<email>\`

### 2. Honest Pass/Fail Recording
Do not mark everything as Pass. If a test fails, record it as Fail and note the bug. Instructors know software has bugs — honest recording is the goal.

### 3. Unit Tests
Reference your unit test framework and directory. Report results as a table with test counts and pass/fail totals. Individual test failures should be named.`,
  },

  definition_of_done: {
    example: `# Definition of Done
**Team:** Team Rocket | **Version:** 1.0 | **Date:** Apr 1, 2026

## Task-Level Definition of Done
*"Did we build the thing right?" (Engineering perspective)*

A task is considered done when ALL of the following are true:
- [ ] Code is committed and pushed to the feature branch
- [ ] Code has been reviewed by at least one other team member (pull request approved)
- [ ] All unit tests pass in CI (no failing tests in the suite)
- [ ] No new ESLint errors introduced (run \`npm run lint\`)
- [ ] External/public API endpoints are documented in the README

## User Story-Level Definition of Done
*"Did we build the right thing?" (User perspective)*

A user story is considered done when ALL of the following are true:
- [ ] All tasks for the story are marked complete
- [ ] All acceptance criteria have been tested and pass
- [ ] Feature has been demonstrated to and accepted by the Product Owner
- [ ] Feature branch merged into main via pull request
- [ ] No regression in previously passing system tests`,
    guide: `## How to write a strong Definition of Done

**From the course slides (Scrum Best Practices) and Agile literature:**

### Two required sections

**1. Task-Level DoD** — "Did you build the thing right?"
Covers engineering quality. Must include:
- Code review by a team member (not just self-review)
- Unit tests passing
- Code committed/pushed to repository
- Any relevant quality checks (linting, static analysis)

**2. User Story-Level DoD** — "Did you build the right thing?"
Covers user value delivery. Must include:
- All story tasks complete
- Acceptance criteria verified and passing
- Product Owner review and acceptance

### What makes a good criterion
✅ **Specific and verifiable:** "All unit tests pass in CI"
❌ **Vague and unverifiable:** "Quality is good", "Code is clean"

### Keep it practical
The best Definition of Done is one the team actually applies consistently. Aim for 4–8 items per section. Too few = not rigorous. Too many = team starts skipping items.`,
  },

  code_standards: {
    example: `# Code Standards
**Team:** Team Rocket | **Stack:** TypeScript, React, Node.js | **Version:** 1.0

## Style Guide Reference
We follow the **Google TypeScript Style Guide** and enforce it with **ESLint + Airbnb config** (\`npm run lint\`).

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | \`eventCount\`, \`isLoggedIn\` |
| Boolean variables | \`is\`/\`has\`/\`can\` prefix | \`isLoading\`, \`hasPermission\` |
| Functions | verb + noun, camelCase | \`fetchEvents()\`, \`validateUser()\` |
| React components | PascalCase | \`EventCard\`, \`LoginForm\` |
| Constants | UPPER_SNAKE_CASE | \`MAX_EVENTS = 50\` |
| Types/Interfaces | PascalCase, no \`I\` prefix | \`UserProfile\`, \`EventData\` |

**No magic numbers:** Replace \`if (status === 3)\` with \`if (status === Status.CANCELLED)\`.

## Formatting
- **Indentation:** 2 spaces (no tabs)
- **Line length:** max 100 characters
- **Quotes:** single quotes for strings, template literals for interpolation
- **Semicolons:** always required
- **Braces:** opening brace on same line as declaration

Enforced automatically by ESLint — run \`npm run lint\` before committing.

## Best Practices
- **DRY:** Extract repeated logic into shared utilities in \`/lib/utils\`
- **Single Responsibility:** Each function/component does one thing. If it needs more than one paragraph to describe, split it.
- **Clarity over cleverness:** Write code for the next reader. Avoid one-liners that sacrifice readability.
- **No commented-out code:** Delete unused code. Git history preserves it.`,
    guide: `## How to write a strong Code Standards document

**From the course slides (Agile Clean Code + Simple Design):**

> "A coding standard is foundational for working as a team that collectively owns the code."

### 1. Reference an established style guide
Don't invent all your rules from scratch. Start with an accepted standard:
- TypeScript/JavaScript: Google TypeScript Style Guide, Airbnb ESLint config
- Python: PEP 8, Google Python Style Guide
- Java: Google Java Style Guide

State which guide you follow and how you enforce it (linter, formatter).

### 2. Naming conventions
The slides emphasize: *"Promote intention-revealing code."*
- Variable names should be accurate, purposeful, and pronounceable
- Function names should describe exactly what they do — avoid vague verbs like \`handleCalcs()\`, \`processInput()\`, \`doStuff()\`
- No magic numbers — use named constants

### 3. Formatting rules
Must cover: indentation (spaces vs tabs, how many), line length, brace placement. These should be enforced by a linter/formatter, not left to individual judgment.

### 4. Best practices
Include: DRY (Don't Repeat Yourself), single responsibility, clarity over cleverness. The slides say: *"Ease of reading and understanding is more important than ease of writing."*

### 5. Be language-specific
Generic advice that doesn't mention your stack is weak. Every rule should make sense for the languages your team actually uses.`,
  },

  unknown: {
    example: "",
    guide: "This file was not matched to a known document type. Rename it to one of the standard filenames: sprint-1-plan.md, sprint-1-report.md, release-plan.md, test-plan.md, definition-of-done.md, or code-standards.md.",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDocType(docType: string): string {
  return docType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDocTitle(doc: ClassifiedDoc): string {
  if (doc.sprintNumber) {
    if (doc.docType === "sprint_plan") return `Sprint ${doc.sprintNumber} Plan`;
    if (doc.docType === "sprint_report") return `Sprint ${doc.sprintNumber} Report`;
  }
  return formatDocType(doc.docType);
}

function sortClassifications(classifications: ClassifiedDoc[]): ClassifiedDoc[] {
  // Interleaved order: release → S1 plan → S1 report → S2 plan → S2 report → ... → test → dod → code standards
  function sortKey(c: ClassifiedDoc): string {
    if (c.docType === "release_plan") return "0_0_0";
    if (c.docType === "sprint_plan")  return `1_${c.sprintNumber ?? 0}_0`;
    if (c.docType === "sprint_report") return `1_${c.sprintNumber ?? 0}_1`;
    if (c.docType === "test_plan")        return "2_0_0";
    if (c.docType === "definition_of_done") return "3_0_0";
    if (c.docType === "code_standards")   return "4_0_0";
    return "9_0_0";
  }
  return [...classifications].sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

function formatChecklistKey(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function checklistSummary(review?: DocumentReview) {
  const entries = review?.structured?.checklist
    ? Object.entries(review.structured.checklist)
    : [];
  const passed = entries.filter(([, value]) => value).length;
  return { entries, passed, total: entries.length };
}

function previewText(text: string | undefined, max = 180): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function buildGithubUrl(repoUrl: string | null | undefined, path: string): string | null {
  if (!repoUrl) return null;
  return `${repoUrl}/blob/main/${path}`;
}

// ---------------------------------------------------------------------------
// Required Docs table
// ---------------------------------------------------------------------------

type RequiredDocStatus = "missing" | "duplicate" | "needs_attention" | "ok";

function getRequiredDocStatus(
  doc: ClassifiedDoc | undefined,
  review: DocumentReview | undefined,
): RequiredDocStatus {
  if (!doc) return "missing";
  if (doc.duplicate) return "duplicate";
  if (!review) return "ok"; // classified but not reviewed — treat as ok
  if (review.error) return "needs_attention";
  // Check checklist failure rate for structured docs
  if (review.structured?.checklist) {
    const entries = Object.values(review.structured.checklist);
    const failed = entries.filter((v) => !v).length;
    if (entries.length > 0 && failed / entries.length > 0.4) return "needs_attention";
  }
  return "ok";
}

function StatusChip({ status }: { status: RequiredDocStatus }) {
  if (status === "missing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-400">
        <X className="size-3" aria-hidden />
        Missing
      </span>
    );
  }
  if (status === "duplicate") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
        Duplicate
      </span>
    );
  }
  if (status === "needs_attention") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
        ⚠ Needs attention
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400">
      <Check className="size-3" aria-hidden />
      OK
    </span>
  );
}

function RequiredDocsTable({
  classifications,
  reviews,
  repoUrl,
  onLabelClick,
  onRerun,
  running,
}: {
  classifications: ClassifiedDoc[];
  reviews: Record<string, DocumentReview>;
  repoUrl: string | null;
  onLabelClick: (docType: string) => void;
  onRerun: () => void;
  running: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Required Documents</CardTitle>
          <CardDescription>All 12 required course documents and their status.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={onRerun} disabled={running} className="shrink-0">
          {running ? "Re-running…" : "Re-run review"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-6 gap-y-0 text-sm">
          {REQUIRED_DOCS.map((req) => {
            const match = classifications.find((c) => {
              if (c.docType !== req.docType) return false;
              if (req.sprintNumber !== null) return c.sprintNumber === req.sprintNumber;
              return true;
            });
            const review = match ? reviews[match.path] : undefined;
            const status = getRequiredDocStatus(match, review);
            const githubUrl = match ? buildGithubUrl(repoUrl, match.path) : null;

            return (
              <div key={req.label} className="flex items-center justify-between gap-3 border-b border-border/40 py-2 last:border-0">
                <span className="font-medium">
                  {githubUrl ? (
                    <a
                      href={githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {req.label}
                    </a>
                  ) : (
                    req.label
                  )}
                </span>
                <StatusChip status={status} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Checklist breakdown with ? explanation button
// ---------------------------------------------------------------------------

function ChecklistBreakdown({
  review,
  onExplain,
}: {
  review: DocumentReview;
  onExplain: (key: string) => void;
}) {
  if (!review.structured?.checklist) return null;
  const { entries, passed } = checklistSummary(review);

  return (
    <div className="space-y-2">
      <ul className="space-y-1">
        {entries.map(([key, value]) => (
          <li key={key} className="flex items-start gap-2 text-sm">
            {value ? (
              <Check
                className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400"
                aria-hidden
              />
            ) : (
              <X
                className="mt-0.5 size-4 shrink-0 text-red-500 dark:text-red-400"
                aria-hidden
              />
            )}
            <span className={value ? "text-foreground" : "text-muted-foreground"}>
              {formatChecklistKey(key)}
            </span>
            {CHECKLIST_EXPLANATIONS[key] ? (
              <button
                type="button"
                aria-label={`Explain: ${formatChecklistKey(key)}`}
                className="ml-0.5 mt-0.5 shrink-0 text-muted-foreground hover:text-foreground focus:outline-none"
                onClick={() => onExplain(key)}
              >
                <HelpCircle className="size-3" aria-hidden />
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric chip
// ---------------------------------------------------------------------------

function MetricChip({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="inline-flex flex-col items-center rounded-md border border-border bg-muted/40 px-3 py-1.5 text-center min-w-[80px]">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value ?? "—"}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Burnup chart
// ---------------------------------------------------------------------------

function BurnupChart({ data }: { data: Array<{ day: number; completed: number; ideal: number }> }) {
  if (!data || data.length === 0) return null;

  const width = 480;
  const height = 200;
  const paddingLeft = 40;
  const paddingBottom = 30;
  const paddingTop = 10;
  const paddingRight = 16;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingBottom - paddingTop;

  const maxDay = Math.max(...data.map(d => d.day));
  const maxVal = Math.max(...data.map(d => Math.max(d.completed, d.ideal)), 1);

  const xScale = (day: number) => paddingLeft + (day / maxDay) * chartW;
  const yScale = (val: number) => paddingTop + chartH - (val / maxVal) * chartH;

  const toPath = (points: Array<{ x: number; y: number }>) =>
    points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  const actualPoints = data.map(d => ({ x: xScale(d.day), y: yScale(d.completed) }));
  const idealPoints = data.map(d => ({ x: xScale(d.day), y: yScale(d.ideal) }));

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => ({ val: Math.round(t * maxVal), y: yScale(t * maxVal) }));
  // X-axis ticks — show every other day if many days
  const step = maxDay > 10 ? 2 : 1;
  const xTicks = data.filter(d => d.day % step === 0 || d.day === maxDay);

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">Burnup Chart</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full max-w-lg rounded-md border border-border bg-muted/20"
        aria-label="Burnup chart"
      >
        {/* Grid lines */}
        {yTicks.map(t => (
          <line key={t.val} x1={paddingLeft} y1={t.y} x2={width - paddingRight} y2={t.y}
            stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
        ))}
        {/* Ideal trend line (dashed) */}
        <path d={toPath(idealPoints)} fill="none" stroke="currentColor" strokeOpacity={0.35}
          strokeWidth={1.5} strokeDasharray="4 3" />
        {/* Actual completed line */}
        <path d={toPath(actualPoints)} fill="none" stroke="#3b82f6" strokeWidth={2} />
        {/* Actual dots */}
        {actualPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill="#3b82f6" />
        ))}
        {/* Y-axis labels */}
        {yTicks.map(t => (
          <text key={t.val} x={paddingLeft - 4} y={t.y + 4} textAnchor="end"
            fontSize={9} fill="currentColor" opacity={0.5}>{t.val}h</text>
        ))}
        {/* X-axis labels */}
        {xTicks.map(d => (
          <text key={d.day} x={xScale(d.day)} y={height - 4} textAnchor="middle"
            fontSize={9} fill="currentColor" opacity={0.5}>D{d.day}</text>
        ))}
        {/* Legend */}
        <line x1={paddingLeft + 4} y1={paddingTop + 8} x2={paddingLeft + 18} y2={paddingTop + 8}
          stroke="#3b82f6" strokeWidth={2} />
        <text x={paddingLeft + 22} y={paddingTop + 12} fontSize={9} fill="currentColor" opacity={0.7}>Actual</text>
        <line x1={paddingLeft + 56} y1={paddingTop + 8} x2={paddingLeft + 70} y2={paddingTop + 8}
          stroke="currentColor" strokeOpacity={0.4} strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={paddingLeft + 74} y={paddingTop + 12} fontSize={9} fill="currentColor" opacity={0.7}>Ideal</text>
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review card
// ---------------------------------------------------------------------------

function ReviewCard({
  doc,
  review,
  repoUrl,
  onExplain,
  onTemplateClick,
}: {
  doc: ClassifiedDoc;
  review?: DocumentReview;
  repoUrl: string | null;
  onExplain: (key: string) => void;
  onTemplateClick: (docType: string) => void;
}) {
  const isUnknown = doc.docType === "unknown";
  const [expanded, setExpanded] = useState(false);
  const { passed, total } = checklistSummary(review);
  const summaryText = review?.structured?.coach
    ? previewText(review.structured.coach)
    : review?.holistic?.strengths
      ? previewText(review.holistic.strengths)
      : "";
  const suggestionPreview = review?.holistic?.improvements
    ? previewText(review.holistic.improvements)
    : "";
  const hasDetails = Boolean(
    review &&
      !review.error &&
      (review.structured?.checklist ||
        review.structured?.coach ||
        review.holistic?.strengths ||
        review.holistic?.improvements),
  );

  const githubUrl = buildGithubUrl(repoUrl, doc.path);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium capitalize">
          {formatDocTitle(doc)}
          {doc.duplicate ? (
            <span className="ml-2 text-xs font-normal text-amber-600 dark:text-amber-400">
              duplicate
            </span>
          ) : null}
        </CardTitle>
        <CardDescription className="flex items-center gap-3 text-xs">
          <button
            onClick={() => onTemplateClick(doc.docType)}
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {formatDocTitle(doc)} Template
          </button>
          {githubUrl ? (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-muted-foreground hover:underline"
            >
              {doc.path}
            </a>
          ) : (
            <span className="font-mono text-muted-foreground">{doc.path}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isUnknown ? (
          <p className="text-muted-foreground">
            This file was not matched to a course document type, so no rubric review was run.
            Rename or move it under a docs folder with a clearer name (e.g.{" "}
            <span className="font-mono text-xs">sprint1-report.md</span>,{" "}
            <span className="font-mono text-xs">release-plan.md</span>).
          </p>
        ) : null}

        {review?.error ? (
          <p className="text-destructive">Review error: {review.error}</p>
        ) : null}

        {!isUnknown && !review ? (
          <p className="text-muted-foreground">No review result stored for this file.</p>
        ) : null}

        {review && !review.error ? (
          <div className="space-y-3">
            <div className="space-y-2">
              {review.structured ? (
                <>
                  {/* Metrics row */}
                  <div className="flex flex-wrap gap-2">
                    {/* Always show checklist score */}
                    {review.structured.checklist && (() => {
                      const entries = Object.entries(review.structured.checklist);
                      const passedCount = entries.filter(([, v]) => v).length;
                      return <MetricChip label="Checklist" value={`${passedCount}/${entries.length}`} />;
                    })()}
                    {/* Sprint Plan metrics */}
                    {doc.docType === "sprint_plan" && (
                      <>
                        <MetricChip label="User Stories" value={review.structured.userStoryCount ?? "—"} />
                        <MetricChip label="Tasks" value={review.structured.taskCount ?? "—"} />
                        <MetricChip label="Hours" value={review.structured.totalHoursCommitted != null ? `${review.structured.totalHoursCommitted}h` : "—"} />
                      </>
                    )}
                    {/* Sprint Report metrics */}
                    {doc.docType === "sprint_report" && (
                      <>
                        {review.structured.completedStoryCount != null && review.structured.totalStoryCount != null ? (
                          <MetricChip
                            label="Completed"
                            value={`${review.structured.completedStoryCount}/${review.structured.totalStoryCount} (${Math.round((review.structured.completedStoryCount / review.structured.totalStoryCount) * 100)}%)`}
                          />
                        ) : (
                          <MetricChip label="Completed" value="unknown" />
                        )}
                        <MetricChip label="Stories/day" value={review.structured.storiesPerDay != null ? review.structured.storiesPerDay.toFixed(1) : "unknown"} />
                        <MetricChip label="Hours/day" value={review.structured.hoursPerDay != null ? `${review.structured.hoursPerDay.toFixed(1)}h` : "unknown"} />
                      </>
                    )}
                  </div>
                  {summaryText ? (
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Initial feedback: </span>
                      {summaryText}
                    </p>
                  ) : null}
                </>
              ) : null}

              {review.holistic ? (
                <div className="space-y-1 text-muted-foreground">
                  {summaryText ? (
                    <p>
                      <span className="font-medium text-foreground">Strengths: </span>
                      {summaryText}
                    </p>
                  ) : null}
                  {suggestionPreview ? (
                    <p>
                      <span className="font-medium text-foreground">Suggestions: </span>
                      {suggestionPreview}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            {hasDetails ? (
              <div className="rounded-lg border border-border/60">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium"
                  onClick={() => setExpanded((v) => !v)}
                >
                  <span>{expanded ? "Hide detailed feedback" : "Show detailed feedback"}</span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {expanded ? (
                  <div className="space-y-3 border-t border-border/60 px-4 py-4">
                    {review.structured ? (
                      <>
                        {/* Burnup chart — sprint_report only */}
                        {doc.docType === "sprint_report" && review.structured.burnupData && review.structured.burnupData.length > 0 && (
                          <BurnupChart data={review.structured.burnupData} />
                        )}
                        <ChecklistBreakdown review={review} onExplain={onExplain} />
                        {review.structured.coach ? (
                          <div>
                            <p className="mb-1 font-medium">Coach feedback</p>
                            <p className="leading-relaxed text-muted-foreground">
                              {review.structured.coach}
                            </p>
                          </div>
                        ) : null}
                      </>
                    ) : null}

                    {review.holistic ? (
                      <div className="space-y-2 text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">Strengths: </span>
                          {review.holistic.strengths}
                        </p>
                        <p>
                          <span className="font-medium text-foreground">Suggestions: </span>
                          {review.holistic.improvements}
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Stat info card
// ---------------------------------------------------------------------------

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="inline-flex flex-col items-center rounded-md border border-border/60 bg-muted/30 px-3 py-1.5 text-center">
      <span className="text-base font-semibold leading-tight text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Explanation modal (fixed overlay)
// ---------------------------------------------------------------------------

function ExplanationModal({
  explanationKey,
  onClose,
}: {
  explanationKey: string | null;
  onClose: () => void;
}) {
  if (!explanationKey) return null;
  const explanation = CHECKLIST_EXPLANATIONS[explanationKey] ?? "No explanation available.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-base font-semibold">
          {formatChecklistKey(explanationKey)}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{explanation}</p>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template modal (fixed overlay, tabbed)
// ---------------------------------------------------------------------------

function TemplateModal({
  docType,
  onClose,
}: {
  docType: string | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"example" | "guide">("example");

  if (!docType) return null;
  const template = DOC_TEMPLATES[docType] ?? DOC_TEMPLATES.unknown;

  // Find label for this docType
  const reqDoc = REQUIRED_DOCS.find((r) => r.docType === docType);
  const title = reqDoc?.label ?? formatDocType(docType);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-background shadow-xl"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" aria-hidden />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border px-6 pt-3">
          <button
            type="button"
            className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "example"
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("example")}
          >
            Example
          </button>
          <button
            type="button"
            className={`rounded-t-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === "guide"
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setTab("guide")}
          >
            Writing Guide
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4">
          {tab === "example" ? (
            template.example ? (
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
                {template.example}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">{template.guide}</p>
            )
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {template.guide}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main tab component
// ---------------------------------------------------------------------------

export function DocReviewTab({ resultId, report }: DocReviewTabProps) {
  const [docReview, setDocReview] = useState<DocReviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [explanationKey, setExplanationKey] = useState<string | null>(null);
  const [templateDocType, setTemplateDocType] = useState<string | null>(null);

  const courseId = report._submission?.course_id?.trim();
  const repoUrl = report.source?.url ?? null;

  const fetchExisting = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/results/${encodeURIComponent(resultId)}/doc-review`, {
        credentials: "include",
      });
      if (res.status === 404) {
        setDocReview(null);
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Failed to load (${res.status})`);
      }
      setDocReview((await res.json()) as DocReviewResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load doc review");
    } finally {
      setLoading(false);
    }
  }, [resultId]);

  useEffect(() => {
    void fetchExisting();
  }, [fetchExisting]);

  const runReview = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/doc-review", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId,
          url: report.source?.url,
          report,
        }),
      });
      const data = (await res.json()) as DocReviewResult & { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? `Review failed (${res.status})`);
      }
      setDocReview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Documentation review failed");
    } finally {
      setRunning(false);
    }
  };

  const stats = useMemo(() => {
    if (!docReview) return null;
    const discovered =
      docReview.discovery.docsPool.length + docReview.discovery.repoWide.length;
    const skippedImages = docReview.discovery.skippedImages?.length ?? 0;
    const classified = docReview.classifications.length;
    const reviewed = Object.keys(docReview.reviews).length;
    const knownTypes = docReview.classifications.filter(
      (c) => c.docType !== "unknown",
    ).length;
    return { discovered, skippedImages, classified, reviewed, knownTypes };
  }, [docReview]);

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading documentation review…
      </p>
    );
  }

  return (
    <>
      {/* Modals */}
      <ExplanationModal
        explanationKey={explanationKey}
        onClose={() => setExplanationKey(null)}
      />
      <TemplateModal
        docType={templateDocType}
        onClose={() => setTemplateDocType(null)}
      />

      <div className="space-y-6">
        {/* 1. Research notice */}
        {courseId ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
            <span className="font-medium text-blue-900 dark:text-blue-100">
              Research submission
            </span>
            <span className="ml-4 text-blue-700 dark:text-blue-300">
              Documentation review supports course research and is not used to grade individual
              students.
            </span>
          </div>
        ) : null}

        {/* 2. Error message */}
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {/* 3. Run/Re-run CTA (when no docReview yet) */}
        {!docReview ? (
          <Card>
            <CardHeader>
              <CardTitle>Review project documentation</CardTitle>
              <CardDescription>
                Classify and review planning documents (.md) in this repository against
                course rubrics. Use the standard filenames inside the
                <span className="mx-1 font-mono text-xs">documentation/</span>
                folder.
                Typical run ~1 minute; requires sign-in and OpenAI configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => void runReview()} disabled={running}>
                {running ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    Reviewing…
                  </>
                ) : (
                  "Review documentation"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {docReview && stats ? (
          <>
            {/* 4. Required Documents table (Re-run button lives here) */}
            <RequiredDocsTable
              classifications={docReview.classifications}
              reviews={docReview.reviews}
              repoUrl={repoUrl}
              onLabelClick={(docType) => setTemplateDocType(docType)}
              onRerun={() => void runReview()}
              running={running}
            />

            {/* 6. Document reviews */}
            {docReview.classifications.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Document reviews</h3>
                {sortClassifications(docReview.classifications).map((c) => (
                  <ReviewCard
                    key={c.path}
                    doc={c}
                    review={docReview.reviews[c.path]}
                    repoUrl={repoUrl}
                    onExplain={(key) => setExplanationKey(key)}
                    onTemplateClick={(docType) => setTemplateDocType(docType)}
                  />
                ))}
              </div>
            ) : stats.skippedImages > 0 && stats.discovered === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Minus className="size-4 text-muted-foreground" aria-hidden />
                    Documentation present as images only
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  This repo has files under documentation folders, but they are images rather than
                  markdown or PDF. Consistency checks may flag missing release plans or code
                  standards until those are available in a reviewable format.
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">No reviewable documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    No markdown files were found to classify in the
                    <span className="mx-1 font-mono text-xs">documentation/</span>
                    folder.
                  </p>
                  {(docReview.discovery.skippedImages?.length ?? 0) > 0 ? (
                    <p>
                      For repos with{" "}
                      <span className="font-mono text-xs">Release.png</span> and{" "}
                      <span className="font-mono text-xs">CodeStandards.png</span>, re-export those
                      as markdown or PDF to get rubric reviews.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {/* 7. Consistency checks */}
            {docReview.consistency.warnings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Consistency checks</CardTitle>
                  <CardDescription>
                    Deterministic checks across classified documents and repo metadata.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {docReview.consistency.warnings.map((w) => (
                      <li key={`${w.code}-${w.message}`} className="text-muted-foreground">
                        <span className="font-medium text-foreground">{w.code}:</span> {w.message}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {/* 8. Pipeline notes */}
            {docReview.warnings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pipeline notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                    {docReview.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {/* 9. Skipped images */}
            {(docReview.discovery.skippedImages?.length ?? 0) > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Skipped image files</CardTitle>
                  <CardDescription>
                    Only markdown files are reviewed. Export release plans and code standards as
                    <span className="mx-1 font-mono text-xs">.md</span>
                    if you want rubric feedback.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 font-mono text-xs text-muted-foreground">
                    {docReview.discovery.skippedImages!.map((path) => (
                      <li key={path}>{path}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}
          </>
        ) : null}
      </div>
    </>
  );
}
