# Sprint 1 Plan
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
| Friday | 10:00 AM | Daily Scrum |
