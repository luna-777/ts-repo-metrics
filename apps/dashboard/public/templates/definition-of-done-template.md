# Definition of Done
**Team:** Team Rocket | **Version:** 1.0 | **Date:** Apr 1, 2026

## Task-Level Definition of Done
*"Did we build the thing right?" (Engineering perspective)*

A task is considered done when ALL of the following are true:
- [ ] Code is committed and pushed to the feature branch
- [ ] Code has been reviewed by at least one other team member (pull request approved)
- [ ] All unit tests pass in CI (no failing tests in the suite)
- [ ] No new ESLint errors introduced (run `npm run lint`)
- [ ] External/public API endpoints are documented in the README

## User Story-Level Definition of Done
*"Did we build the right thing?" (User perspective)*

A user story is considered done when ALL of the following are true:
- [ ] All tasks for the story are marked complete
- [ ] All acceptance criteria have been tested and pass
- [ ] Feature has been demonstrated to and accepted by the Product Owner
- [ ] Feature branch merged into main via pull request
- [ ] No regression in previously passing system tests
