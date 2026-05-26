# Code Standards
**Team:** Team Rocket | **Stack:** TypeScript, React, Node.js | **Version:** 1.0

## Style Guide Reference
We follow the **Google TypeScript Style Guide** and enforce it with **ESLint + Airbnb config** (`npm run lint`).

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Variables | camelCase | `eventCount`, `isLoggedIn` |
| Boolean variables | `is`/`has`/`can` prefix | `isLoading`, `hasPermission` |
| Functions | verb + noun, camelCase | `fetchEvents()`, `validateUser()` |
| React components | PascalCase | `EventCard`, `LoginForm` |
| Constants | UPPER_SNAKE_CASE | `MAX_EVENTS = 50` |
| Types/Interfaces | PascalCase, no `I` prefix | `UserProfile`, `EventData` |

**No magic numbers:** Replace `if (status === 3)` with `if (status === Status.CANCELLED)`.

## Formatting
- **Indentation:** 2 spaces (no tabs)
- **Line length:** max 100 characters
- **Quotes:** single quotes for strings, template literals for interpolation
- **Semicolons:** always required
- **Braces:** opening brace on same line as declaration

Enforced automatically by ESLint — run `npm run lint` before committing.

## Best Practices
- **DRY:** Extract repeated logic into shared utilities in `/lib/utils`
- **Single Responsibility:** Each function/component does one thing. If it needs more than one paragraph to describe, split it.
- **Clarity over cleverness:** Write code for the next reader. Avoid one-liners that sacrifice readability.
- **No commented-out code:** Delete unused code. Git history preserves it.
