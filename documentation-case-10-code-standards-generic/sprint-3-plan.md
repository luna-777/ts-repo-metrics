# Sprint 3 Plan | Campus Event App | Team Rocket | Due: June 27, 2026 | Rev 1.0 | 2026-06-15

## Team
- Alice — Scrum Master
- Bob — Product Owner
- Carol — Developer
- Dave — Developer

## Sprint Goal
Add social engagement features so students can comment on events and receive reminders before attending.

## Capacity
- Team available hours: 90h
- Committed hours: 76h
- Buffer reserved: 14h (16%)

## Scrum Times
- Monday 10:00am — Daily Standup
- Wednesday 10:00am — Daily Standup
- Thursday 2:00pm — TA Visit
- Friday 10:00am — Sprint Review

---

## User Stories

### US-7: Comment on Events
**As a** student, **I want to** comment on an event, **so that** I can ask questions or share details with others.

**Acceptance Criteria:**
1. Given I am signed in, when I post a comment, then it appears in the event discussion thread with my name and timestamp.
2. Given I submit an empty comment, then I see "Comment cannot be empty."

**Tasks:**
- [ ] Code comment form and threaded comment list in EventDetail page (5h) — Carol
- [ ] Write POST /api/events/:id/comments endpoint with validation (5h) — Dave
- [ ] Write unit tests for empty-comment and successful-post flows (3h) — Dave

**Story Total: 13h**

---

### US-8: Receive Event Reminder
**As a** student, **I want to** receive a reminder before an event, **so that** I do not miss it.

**Acceptance Criteria:**
1. Given I RSVP to an event, then a reminder is scheduled 24 hours before the event.
2. Given I cancel my RSVP, then the reminder is removed.

**Tasks:**
- [ ] Code reminder preference toggle in RSVP settings panel (3h) — Carol
- [ ] Write reminder scheduling service for RSVP create/cancel flows (5h) — Dave
- [ ] Write tests for reminder creation and cancellation logic (3h) — Dave

**Story Total: 11h**

---

### US-9: Moderate Inappropriate Comments
**As a** product owner, **I want to** hide inappropriate comments, **so that** event discussions stay safe and useful.

**Acceptance Criteria:**
1. Given I am an authorized moderator, when I hide a comment, then it is removed from the public thread.
2. Given I am not authorized, when I try to moderate, then I receive a forbidden error.

**Tasks:**
- [ ] Code moderator actions in admin comment queue UI (4h) — Carol
- [ ] Write PATCH /api/comments/:id/moderate endpoint with role checks (5h) — Dave
- [ ] Design moderation status indicators in admin queue (2h) — Carol

**Story Total: 11h**

---

## Initial Task Assignments
- Carol: US-7 task 1 · US-8 task 1 · US-9 tasks 1, 3
- Dave: US-7 tasks 2, 3 · US-8 tasks 2, 3 · US-9 task 2
- Bob: Story acceptance review and moderation policy review
- Alice: Scrum facilitation and blocker follow-up
