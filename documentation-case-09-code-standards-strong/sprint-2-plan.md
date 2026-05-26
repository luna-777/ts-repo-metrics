# Sprint 2 Plan | Campus Event App | Team Rocket | Due: June 13, 2026 | Rev 1.0 | 2026-06-01

## Team
- Alice — Scrum Master
- Bob — Product Owner
- Carol — Developer
- Dave — Developer

## Sprint Goal
Enable students to RSVP to events, save favorites, and search upcoming events quickly.

## Capacity
- Team available hours: 88h
- Committed hours: 74h
- Buffer reserved: 14h (16%)

## Scrum Times
- Monday 10:00am — Daily Standup
- Wednesday 10:00am — Daily Standup
- Thursday 2:00pm — TA Visit
- Friday 10:00am — Sprint Review

---

## User Stories

### US-4: RSVP to Event
**As a** student, **I want to** RSVP to an event, **so that** I can reserve my spot before it fills up.

**Acceptance Criteria:**
1. Given I am signed in, when I click RSVP on an event, then my RSVP is saved and the button changes to "Going."
2. Given an event is at capacity, when I attempt to RSVP, then I see "This event is full."

**Tasks:**
- [ ] Code RSVP button state transitions in EventCard component (4h) — Carol
- [ ] Write POST /api/events/:id/rsvp endpoint with capacity check (5h) — Dave
- [ ] Write unit tests for RSVP success and full-event error states (3h) — Dave

**Story Total: 12h**

---

### US-5: Save Favorite Events
**As a** student, **I want to** save favorite events, **so that** I can quickly revisit the ones I care about.

**Acceptance Criteria:**
1. Given I click the favorite icon, then the event appears in my favorites list.
2. Given I remove a favorite, then it no longer appears in the favorites list after refresh.

**Tasks:**
- [ ] Code favorite toggle UI with saved/unsaved icon states (3h) — Carol
- [ ] Write POST /api/favorites and DELETE /api/favorites endpoints (5h) — Dave
- [ ] Design favorites page section with empty-state message (2h) — Carol

**Story Total: 10h**

---

### US-6: Search Events
**As a** student, **I want to** search events by keyword, **so that** I can find relevant events faster.

**Acceptance Criteria:**
1. Given I type a keyword, then matching events are shown in the results list.
2. Given there are no matches, then I see "No events match your search."

**Tasks:**
- [ ] Code debounced search input component for event listing page (4h) — Carol
- [ ] Write GET /api/events/search endpoint with keyword filtering (4h) — Dave
- [ ] Write integration tests for match and no-results scenarios (3h) — Dave

**Story Total: 11h**

---

## Initial Task Assignments
- Carol: US-4 task 1 · US-5 tasks 1, 3 · US-6 task 1
- Dave: US-4 tasks 2, 3 · US-5 task 2 · US-6 tasks 2, 3
- Bob: Acceptance criteria review and backlog refinement
- Alice: Sprint facilitation and blocker follow-up
