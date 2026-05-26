# Sprint 4 Plan | Campus Event App | Team Rocket | Due: July 11, 2026 | Rev 1.0 | 2026-06-29

## Team
- Alice — Scrum Master
- Bob — Product Owner
- Carol — Developer
- Dave — Developer

## Sprint Goal
Improve the organizer experience with attendance analytics, export tools, and final polish for the showcase release.

## Capacity
- Team available hours: 86h
- Committed hours: 72h
- Buffer reserved: 14h (16%)

## Scrum Times
- Monday 10:00am — Daily Standup
- Wednesday 10:00am — Daily Standup
- Thursday 2:00pm — TA Visit
- Friday 10:00am — Sprint Review

---

## User Stories

### US-10: View Attendance Analytics
**As a** campus organizer, **I want to** see attendance analytics, **so that** I can evaluate event engagement.

**Acceptance Criteria:**
1. Given I open the organizer dashboard, then I see RSVP count, attendance count, and attendance rate for each event.
2. Given there is no attendance data yet, then the dashboard shows a clear empty state message.

**Tasks:**
- [ ] Code analytics summary cards in organizer dashboard (4h) — Carol
- [ ] Write GET /api/organizer/analytics endpoint with RSVP and attendance aggregates (5h) — Dave
- [ ] Write tests for populated and empty analytics states (3h) — Dave

**Story Total: 12h**

---

### US-11: Export Attendee List
**As a** campus organizer, **I want to** export the attendee list, **so that** I can use it for event logistics and follow-up.

**Acceptance Criteria:**
1. Given I click export, then a CSV download begins with attendee name, email, and RSVP status.
2. Given there are no attendees, then the export action is disabled and explains why.

**Tasks:**
- [ ] Code export action and disabled-state messaging in organizer tools panel (3h) — Carol
- [ ] Write CSV export endpoint for event attendee lists (5h) — Dave
- [ ] Write integration tests for export success and no-attendee state (3h) — Dave

**Story Total: 11h**

---

### US-12: Final Demo Polish
**As a** student, **I want to** experience a polished event workflow, **so that** the showcase demo feels stable and professional.

**Acceptance Criteria:**
1. Given I navigate the core event flow, then loading and empty states are consistent across pages.
2. Given I use the app on mobile, then the primary event browsing and RSVP flows remain usable.

**Tasks:**
- [ ] Code loading and empty state consistency pass across core event pages (4h) — Carol
- [ ] Design mobile layout fixes for event list and event detail views (3h) — Carol
- [ ] Run manual regression checklist for registration, RSVP, reminders, and favorites (4h) — Dave

**Story Total: 11h**

---

## Initial Task Assignments
- Carol: US-10 task 1 · US-11 task 1 · US-12 tasks 1, 2
- Dave: US-10 tasks 2, 3 · US-11 tasks 2, 3 · US-12 task 3
- Bob: Demo acceptance review and analytics metric validation
- Alice: Sprint facilitation and showcase readiness tracking
