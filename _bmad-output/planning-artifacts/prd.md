---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain-skipped, step-06-innovation-skipped, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
releaseMode: phased
status: complete
completedDate: 2026-04-27
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-todo-app.md
  - _bmad-output/planning-artifacts/product-brief-todo-app-distillate.md
documentCounts:
  briefs: 2
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: web_app
  domain: general
  complexity: low
  projectContext: greenfield
workflowType: 'prd'
---

# Product Requirements Document - Todo App

**Author:** Pasquale
**Date:** 2026-04-27

---

## Executive Summary

Todo App is a focused, full-stack personal task management application built for individual developers who value simplicity and craft over feature abundance. The product solves a specific and well-understood problem: the best-known todo tools have become too complex for personal use, while the best-known learning resources are too shallow to produce production-quality code. Todo App occupies the deliberate middle ground — a real, usable product that also serves as a complete and disciplined reference for modern React + Node.js/Fastify full-stack development.

The application supports four core user actions: creating a task, viewing the full list, marking a task complete, and deleting it. No accounts, no collaboration, no advanced features in v1. Everything included earns its place; everything excluded has an explicit reason. The result is an application that any developer can open, use immediately, and trust across sessions.

This project is also the primary vehicle for mastering the BMad methodology — progressing through each phase from product brief to architecture and implementation with the discipline and rigor the method requires. The product's intentional simplicity makes it the ideal learning substrate: no domain complexity, no regulatory overhead, full attention available for the process itself.

### What Makes This Special

Most todo applications in the wild are either over-engineered SaaS platforms or under-built tutorial projects. Todo App is neither. Its differentiator is execution quality at a minimal scope: polished UI states, consistent error handling, a clean REST API, and a codebase that communicates architectural intent as clearly as the interface communicates function.

The core insight is that craft is a choice, not a function of complexity. A simple app can demonstrate — and teach — the same engineering discipline as a complex one. That conviction shapes every decision in this project.

The product is also a direct vehicle for applied BMad learning: each artifact produced (this PRD included) is as much a deliverable as the running application itself.

### Project Classification

| Attribute | Value |
|-----------|-------|
| **Project Type** | Web Application (React SPA + REST API) |
| **Domain** | General productivity — no regulated industry concerns |
| **Complexity** | Low — standard requirements, no auth in v1, well-understood problem space |
| **Project Context** | Greenfield |
| **Stack** | React (frontend) · Node.js/Fastify (backend) · web-only |

---

## Success Criteria

### User Success

- A new user can create, complete, and delete a task within 60 seconds of first visit — no instructions, tooltips, or onboarding required
- Tasks persist correctly across browser refreshes and sessions — zero data loss under normal operation
- UI interactions (add, complete, delete) respond within 300ms under normal network conditions — no perceptible lag
- Full feature parity and touch-friendly layout on viewports from 320px and above — no horizontal scroll
- Network and API failures surface as non-disruptive, informative UI messages — the app never silently fails or reaches a broken state

### Business / Learning Success

- All BMad methodology artifacts are completed with full discipline: product brief → PRD → architecture → implementation
- Each artifact meets the quality standard of the method — not just produced, but produced correctly
- The project serves as a demonstrable, shareable reference for the BMad workflow applied to a real product

### Technical Success

- Codebase passes ESLint with zero warnings in production build
- TypeScript strict mode (if TS is adopted) — zero type errors
- Test coverage target: ≥ 80% on business logic and API endpoints
- Project cloneable and runnable locally in under 5 minutes from a clean environment
- README documents key architectural decisions, not just setup instructions

### Measurable Outcomes

| Outcome | Target |
|---------|--------|
| First-action time | ≤ 60 seconds from first visit to first completed task |
| UI interaction latency | ≤ 300ms under normal network conditions |
| Data reliability | Zero data loss across any normal browser session |
| Mobile usability | Full feature parity at 320px+ viewport |
| Code quality | ESLint clean, ≥80% test coverage on core logic |
| Onboarding | Run locally in < 5 minutes from README |
| BMad completeness | All 4 artifact phases delivered and complete |

---

## Product Scope

### MVP — Minimum Viable Product (v1)

- Task creation (text description, required; immutable after creation)
- Task list view: active tasks first, completed tasks with strikethrough grouped below; reverse-chronological within each group
- Task completion toggle (reversible)
- Task deletion (permanent)
- Creation timestamp displayed as relative time (e.g. "2 hours ago")
- Responsive layout — desktop and mobile, 320px and above, touch-friendly targets
- Loading state, empty state, error state — all required; no silent failures
- Persistent storage via REST API backend
- REST API: full CRUD on tasks with consistent JSON error responses
- Data model includes nullable `user_id` from day one (forward-compatible, not a v1 feature)

### Growth Features (Post-MVP)

- User authentication and personal accounts
- Task editing after creation
- Priority levels
- Due dates with overdue indicators
- TypeScript end-to-end (if not adopted in v1)
- Dark mode

### Vision (Future)

- Multi-user support and collaboration
- Task organization (tags, priorities, due dates)
- Search and filtering
- Offline support / PWA
- Notifications and reminders

---

## User Journeys

### Journey 1: Primary User — Daily Use (Success Path)

**Persona: Marco, Software Developer**
Marco is a mid-level developer who keeps a mental list of things to do throughout his workday — small tasks, reminders, follow-ups. He's tried Todoist and Notion but always ends up abandoning them within a week. Too many features, too much setup. He just wants something that works when he opens it.

**Opening Scene:** It's 9am. Marco opens Todo App in a browser tab. His list from yesterday loads instantly — three active tasks, two completed ones marked with strikethrough at the bottom. No loading spinner, no splash screen. He's looking at his data.

**Rising Action:** He types a new task — "Review PR from Ana" — and hits Enter. The task appears at the top of the active list immediately. No confirmation dialog, no page reload. He completes another task from yesterday by clicking its checkbox; it slides down to the completed group with a strikethrough. The timestamp on the new task reads "just now."

**Climax:** At end of day, Marco deletes three completed tasks he no longer needs. Three clicks. The list is clean. He closes the tab.

**Resolution:** The next morning, he opens the app. His two remaining active tasks are exactly where he left them. No lost data, no surprises. The app is just there, doing its job. He trusts it.

**Requirements revealed:** Instant task creation on Enter, optimistic UI updates, persistent state across sessions, reliable delete, relative timestamps.

---

### Journey 2: Primary User — First Visit (Zero State)

**Persona: Sara, CS Student**
Sara has heard about the app from a fellow student who is following the BMad learning path. She opens it for the first time, not sure what to expect.

**Opening Scene:** Sara lands on the app. There are no tasks. Instead of a blank white void, she sees a simple, friendly empty state — something like "No tasks yet. Add one above." and a clearly visible input field at the top.

**Rising Action:** Without reading anything, she types "Buy groceries" and hits Enter. The task appears. She understands the app immediately. She adds two more tasks. Then she clicks the checkbox on the first one — it moves to the completed section with a strikethrough. She tries deleting one — a single click on a delete icon, task is gone.

**Climax:** In under 60 seconds, Sara has created tasks, completed one, deleted one, and understands the entire product. No tutorial, no tooltip, no onboarding modal.

**Resolution:** She refreshes the page — her tasks are still there. She closes and reopens the tab — still there. The app earns her basic trust immediately.

**Requirements revealed:** Meaningful empty state, prominent add-task input, zero-friction first interaction, session persistence visible immediately.

---

### Journey 3: Primary User — Error Recovery

**Persona: Marco again, this time on a flaky connection**
Marco is working from a café with an unreliable Wi-Fi connection.

**Opening Scene:** Marco adds a task. The request fails silently — or so it appears. Instead, a non-intrusive error message appears near the task: "Couldn't save this task. Retry?" The task is shown in a pending/error state rather than disappearing.

**Rising Action:** Marco clicks "Retry." The network has recovered. The task saves successfully and the error state clears. He marks another task complete — this one also fails. The same non-disruptive inline error appears. He dismisses it and tries again a moment later; it works.

**Climax:** Marco loses Wi-Fi entirely. He tries to add a task. The app shows a clear, calm error — not a broken page, not a white screen. Just "Unable to connect. Check your connection and try again." The existing tasks remain visible and readable.

**Resolution:** When connectivity returns, the app is fully operational again with no reload required. Marco's existing data is intact.

**Requirements revealed:** Per-action error states, retry capability, non-disruptive error UI, graceful degradation on total connectivity loss, existing data visible during failure.

---

### Journey 4: Secondary User — Code Reviewer

**Persona: Lorenzo, Senior Developer evaluating the codebase**
Lorenzo is a senior engineer who has been sent a link to the Todo App GitHub repository as a portfolio piece. He's evaluating it as a reference for a junior developer on his team.

**Opening Scene:** Lorenzo clones the repo. He reads the README — it explains the architecture decisions clearly: why Fastify over Express, how the API is structured, where the React state lives, what the folder structure means. He has the app running locally in under 5 minutes.

**Rising Action:** Lorenzo explores the code. The React components are small and single-purpose. The Fastify routes are clean, with consistent error responses. There's a clear separation between the API layer and the data layer. He finds the task schema — it has a nullable `user_id` field with a comment explaining it's reserved for future auth. He appreciates the forward thinking.

**Climax:** Lorenzo finds the test suite. API endpoints are covered. Business logic has unit tests. He runs `npm test` — everything passes, coverage report shows 82%.

**Resolution:** Lorenzo sends the repo link to his junior developer. "This is how you structure a full-stack app. Read it."

**Requirements revealed:** Clean README with architectural rationale, consistent code structure, documented decisions in code comments, passing test suite with coverage report, runnable from scratch in < 5 minutes.

---

### Journey Requirements Summary

| Capability | Revealed By |
|-----------|-------------|
| Optimistic / immediate UI updates | Journey 1, 2 |
| Persistent backend storage | Journey 1, 2, 3 |
| Meaningful empty state | Journey 2 |
| Per-action inline error states with retry | Journey 3 |
| Graceful total connectivity failure | Journey 3 |
| Relative timestamps | Journey 1 |
| Clean README with architecture decisions | Journey 4 |
| Consistent API error response shape | Journey 4 |
| Test suite with ≥80% coverage | Journey 4 |
| Local setup < 5 minutes | Journey 4 |

---

## Web App Specific Requirements

### Project-Type Overview
Todo App is a single-page application (SPA) built with React. All interactions happen client-side with asynchronous communication to the Fastify REST API backend. No SSR, no multi-page navigation, no real-time infrastructure.

### Browser Matrix
| Browser | Support |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |
| iOS Safari | Last 2 versions |
| Android Chrome | Last 2 versions |
| Internet Explorer | Not supported |
| Legacy browsers | Not supported |

### Responsive Design
- Mobile-first, 320px minimum, 1440px maximum tested
- No horizontal scroll; touch targets ≥44×44px; font ≥16px base

### Accessibility Level
- Semantic HTML throughout
- Full keyboard navigation (Tab, Enter, Space, Delete)
- Visible focus indicators; focus returns to input after task creation
- ARIA labels on icon-only buttons; aria-live regions for async status
- No formal WCAG audit; must not violate WCAG 2.1 A basics

### Implementation Considerations
- React Router for SPA routing (single route likely for v1)
- State: useState/useReducer/context — no external state library
- API: fetch or lightweight wrapper
- Error boundaries at app level
- No SSR/SSG/hydration

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience + Problem-solving — the app must work reliably as a task manager AND feel polished enough to serve as a portfolio piece. Quality is non-negotiable: clean code, consistent error handling, and test coverage are hard MVP criteria, not post-MVP additions.

**Resource Requirements:** Solo developer. No team dependencies. Timeline driven by learning pace, not a shipping deadline.

**Risk Mitigation Focus:** Quality over speed. The MVP ships when the code is worth showing — not when features are barely functional.

---

### MVP Feature Set (Phase 1)

All Phase 1 must-have capabilities are defined in [Product Scope — MVP](#product-scope). All four user journeys are covered in Phase 1:

- Daily active use (Marco — full CRUD with optimistic UI)
- First-time visitor (Sara — empty state → first task)
- Error recovery (Marco — offline / retry gracefully)
- Code review credibility (Lorenzo — README + structure + tests)

**Nice-to-Have (ship if time allows, not a blocker):**
- Smooth CSS transitions on state changes
- Keyboard shortcut hints in UI
- Additional ARIA polish beyond the basic required level

---

### Post-MVP Features

**Phase 2 — Growth:**
- User authentication and personal accounts
- Task editing after creation
- Priority levels
- Due dates with overdue indicators
- TypeScript end-to-end (if not adopted in v1)
- Dark mode

**Phase 3 — Vision:**
- Collaborative task lists (shared between users)
- Labels and project grouping
- Native mobile applications

---

### Risk Mitigation Strategy

**Technical Risks:** Full-stack CRUD on React + Fastify is well-understood territory. Primary risk: over-engineering state management. Mitigation: useState / useReducer / Context only — no external state library in v1.

**Quality Risks (Primary):** Shipping fast at the expense of code structure and test coverage. Mitigation: ESLint-clean code, ≥80% test coverage, and a clear architectural README are locked as hard MVP pass criteria. The sprint does not close until these are green.

**Resource Risks:** Solo developer, no hard deadline — main risk is scope creep. Mitigation: the Phase 1 feature list above is locked. Growth features do not enter the backlog until MVP passes all success criteria.

---

## Functional Requirements

### Task Management

- FR1: User can create a task by providing a text description and submitting it
- FR2: User can mark an active task as complete
- FR3: User can reverse a completed task back to active
- FR4: User can permanently delete a task
- FR5: User receives immediate UI feedback for create, complete, and delete operations (optimistic updates — UI reflects change before API confirms)

### Task List Display

- FR6: User can view all tasks in a single list grouped into active and completed sections
- FR7: User sees active tasks displayed before completed tasks
- FR8: User sees completed tasks visually distinguished (strikethrough treatment)
- FR9: User sees tasks within each group ordered reverse-chronologically
- FR10: User sees the creation time of each task expressed as a human-readable relative label (e.g. "2 hours ago")

### Application States

- FR11: User is shown a meaningful empty state when no tasks exist
- FR12: User is shown a loading indicator during any async operation
- FR13: User is shown an inline error state with a retry action when any task operation fails
- FR14: User is shown a graceful degraded state when the application cannot reach the backend
- FR15: No operation fails silently — every error surfaces a visible indicator to the user

### Data Persistence

- FR16: System persists all task data via a REST API backend
- FR17: System exposes create, read, update (completion toggle), and delete endpoints for tasks
- FR18: System returns consistent, structured JSON error responses for all API failures
- FR19: Task data model includes a nullable `user_id` field (reserved for future auth; not surfaced in v1)

### Accessibility & Navigation

- FR20: User can fully operate the application using keyboard only (Tab, Enter, Space, Delete)
- FR21: User can see a visible focus indicator on the currently focused element at all times
- FR22: Keyboard focus returns to the task input field after a task is successfully created
- FR23: All icon-only interactive elements have accessible text labels
- FR24: User is notified of async operation status changes via accessible live region announcements

### Application Infrastructure

- FR25: Application runs as a single-page application with client-side routing
- FR26: Application renders correctly on viewports from 320px to 1440px wide
- FR27: All interactive touch targets meet minimum size requirements for reliable touch input
- FR28: Application handles uncaught runtime errors at the application boundary without a full crash
- FR29: Developer can run the complete application locally in under 5 minutes following the README
- FR30: Codebase passes ESLint validation with zero errors
- FR31: Core business logic has automated test coverage of ≥80%

---

## Non-Functional Requirements

### Performance

- NFR1: UI interactions (create, toggle, delete) must complete and reflect in the interface within 300ms of user action
- NFR2: Initial application load must complete within 1.5 seconds on a standard broadband connection
- NFR3: API responses must be returned by the server within 200ms for all task CRUD operations under normal load
- NFR4: Cumulative Layout Shift (CLS) score must remain below 0.1 throughout all user interactions
- NFR5: The application must not block the main thread during task list rendering, regardless of task count within normal single-user usage

### Security

- NFR6: All client-server communication must use HTTPS in production
- NFR7: The API must not expose internal error details (stack traces, database errors) in HTTP responses — all errors return a structured JSON envelope only
- NFR8: No sensitive data (passwords, tokens, PII) is stored in v1; the nullable `user_id` field must not be writable via the public API in v1
- NFR9: API endpoints must validate and reject malformed or oversized request payloads

### Accessibility

- NFR10: All interactive elements must be reachable and operable via keyboard alone
- NFR11: All interactive elements must have a visible focus indicator meeting a minimum contrast ratio of 3:1 against adjacent colours
- NFR12: All images and icon-only controls must have programmatic text alternatives
- NFR13: Async status changes must be announced to screen readers via ARIA live regions without requiring user action
- NFR14: The application must not violate any WCAG 2.1 Level A success criteria

### Reliability

- NFR15: Every API error — including network timeouts and 5xx responses — must result in a visible, non-dismissible error state with a retry action; no silent failures
- NFR16: The application must remain partially functional (display cached/last-known state) when the backend is unreachable, rather than crashing or showing a blank screen
- NFR17: Uncaught client-side runtime errors must be caught at the application error boundary and display a recoverable error state rather than an unhandled exception
