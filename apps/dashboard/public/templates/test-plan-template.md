# Test Plan and Report
**Product:** Campus Event App | **Team:** Team Rocket | **Date:** May 15, 2026

## System Test Scenarios

### Scenario 1 — Student Login (US-1)
**Given** a registered student with email `student@ucsc.edu` and password `TestPass123!`
**When** they submit the login form
**Then** they are redirected to the dashboard and their name appears in the navigation bar

**Result: Pass ✅**

---

### Scenario 2 — Invalid Login (US-1)
**Given** a user enters an incorrect password `wrongpassword`
**When** they submit the login form
**Then** an error message "Invalid email or password" is displayed and they remain on the login page

**Result: Pass ✅**

---

### Scenario 3 — Browse Events by Category (US-2)
**Given** a logged-in student on the events page
**When** they select the category `Academic` from the filter dropdown
**Then** only events tagged as Academic are displayed and the count updates to reflect the filtered results

**Result: Pass ✅**

---

### Scenario 4 — Save Event (US-3)
**Given** a logged-in student viewing an event with ID `<event_id>`
**When** they click the "Save Event" button
**Then** the event appears in their "My Events" section and the button changes to "Saved"

**Result: Fail ❌** — Event saves to database but UI does not update without page refresh (bug filed: #42)

---

## Unit Tests

Unit tests are located in `/tests/unit/` using the **Jest** framework with React Testing Library.

| Test Suite | Tests Run | Passed | Failed |
|-----------|-----------|--------|--------|
| AuthService | 12 | 12 | 0 |
| EventController | 8 | 7 | 1 |
| UserModel | 6 | 6 | 0 |
| **Total** | **26** | **25** | **1** |

Failing test: `EventController > filterByCategory > handles empty results` — assertion error on empty array shape.
