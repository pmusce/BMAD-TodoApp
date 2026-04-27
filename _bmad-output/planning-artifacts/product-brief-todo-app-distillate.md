---
title: "Product Brief Distillate: Todo App"
type: llm-distillate
source: "product-brief-todo-app.md"
created: "2026-04-27"
purpose: "Token-efficient context for downstream PRD creation"
---

# Product Brief Distillate: Todo App

## Project Identity

- **Product name:** Todo App
- **Type:** Full-stack web application, single-user personal task manager
- **Nature:** Learning/portfolio project — intentionally real and usable, not a throw-away tutorial
- **Solo developer:** Pasquale (intermediate level)
- **No team, no external stakeholders, no deadline**

---

## Technical Context

- **Frontend:** React (framework confirmed by user)
- **Backend:** Node.js + Fastify (confirmed by user)
- **Platform:** Web only — no native iOS/Android app planned for v1
- **TypeScript:** Not yet decided — open question, leaning toward inclusion for learning value
- **Deployment:** Not specified — likely Vercel/Railway/Fly.io range but not confirmed
- **Database:** Not specified — PostgreSQL is the natural fit for Fastify stack; to be decided in architecture phase
- **Authentication:** None in v1 — explicitly deferred; data model should include nullable user_id from day one to avoid rewrite later

---

## Core Scope — In (v1)

- Create task (text description, required field)
- View task list: active tasks first, completed tasks visually distinguished with strikethrough, grouped below
- Tasks ordered reverse-chronologically within each group (newest first)
- Complete task (toggle, reversible)
- Delete task
- Creation timestamp stored and displayed as relative time (e.g. "2 hours ago")
- Responsive layout — desktop + mobile, 320px and above, touch-friendly
- Loading state, empty state, error state — all required, no silent failures
- Persistent storage via REST API backend
- REST API: full CRUD on tasks

---

## Core Scope — Out (v1, explicitly rejected with rationale)

| Feature | Rationale for exclusion |
|---------|------------------------|
| User accounts / authentication | Out of v1 scope; adds security complexity; not needed for single-user use; deferred to v2 |
| Multi-user support | Depends on auth; not in scope |
| Task editing after creation | Adds UI complexity (inline edit vs modal); not a core action; deferred |
| Task prioritization / ordering | "If everything is urgent, nothing is" — conviction-based exclusion |
| Due dates / deadlines | Time belongs to calendars, not task lists — conviction-based exclusion |
| Tags, labels, categories | Adds cognitive overhead; out of minimal scope |
| Search and filtering | Not needed at small scale; deferred |
| Notifications / reminders | Requires platform integration; far out of scope |
| Collaboration features | Multi-user depends on auth; not in v1 |
| Offline support / PWA | Technically complex (conflict resolution, sync); would compromise backend-first learning goal |
| Dark mode | Nice-to-have; deferred |
| Task ordering / drag-and-drop | Not in v1; reverse-chronological is the implicit sort |

---

## User & Market Context

- **Primary user:** Developer-practitioner — technically proficient individual (developer, CS student, technical professional) who prefers lean, fast tools and distrusts bloated software
- **Secondary user:** Future contributors and portfolio viewers — the codebase itself is a deliverable
- **Target user explicitly NOT:** Non-technical general public; enterprise teams; mobile-native users

### Competitive Intelligence (from web research)

- **Todoist:** Feature-rich, freemium, ~$4/month premium. Users report UI overwhelm and cognitive fatigue. Most common complaints: too many features, performance issues with large task volume.
- **Things 3:** Premium one-time $19.99, macOS/iOS only, elegant UX. Gap: no web/Android, can't be used as reference for full-stack web development.
- **Microsoft To Do / Apple Reminders:** Free, OS-integrated, basic. Vendor lock-in concerns. Not cross-platform in spirit.
- **Notion / Trello / Asana:** Team/project tools — overkill for personal todos, complexity deters casual users.
- **Market signal:** Strong trend toward "return to basics" — products like Amie, SnapTodo, Blitzit, Tweek all positioning on simplicity. 72% of users rate mobile access critical. Performance (#1 pain point) and cost resistance (#3) are recurring frustrations.
- **2,891+ todo repos on GitHub** — market is saturated at tutorial level; differentiation is execution quality and genuine usability.

---

## Success Criteria (measurable)

- New user completes create + complete + delete within 60 seconds on first visit — no instructions needed
- All task data persists correctly across browser refreshes and sessions — no data loss
- UI interactions respond within 300ms under normal network conditions
- Layout is fully functional and touch-friendly from 320px viewport width; no horizontal scroll
- Network/API errors produce non-disruptive, informative UI messages — no silent failures, no broken states
- README documents architecture decisions; project cloneable and runnable locally in under 5 minutes

---

## Open Questions (unresolved at brief completion)

1. **TypeScript vs plain JavaScript?** — TS significantly raises learning value (type-safe API contracts, typed React props); worth confirming before architecture phase
2. **Completed task UX:** Brief currently says strikethrough + grouped below (visible, reversible). Confirm this is the desired behavior vs. immediate removal or "show completed" toggle
3. **Open-source / public repo?** — Publishing to GitHub turns the project into a visible portfolio asset; affects README depth and code comment standards
4. **Deployment platform:** Vercel (frontend) + Railway/Fly.io (backend + DB) is a natural choice for this stack; needs confirmation before architecture
5. **Database choice:** PostgreSQL assumed; SQLite is simpler for a solo learning project (single file, no managed service needed in dev)

---

## Requirements Hints (captured from conversation, not committed)

- Task description is the only required field on creation
- No character limit mentioned — reasonable default would be 280–500 chars
- No task editing — once created, description is immutable in v1
- Completion is reversible (toggle, not one-way)
- Delete is permanent — no soft-delete, no trash/archive in v1
- API should return consistent JSON error shapes (error code + message) for all failure cases
- Data model should include `user_id` as nullable from day one (architecture requirement, not a v1 feature)

---

## Learning Goals (what this project is designed to teach)

- React state management and component architecture in a real, production-quality UI
- Designing and implementing a RESTful API from scratch with Fastify
- Connecting a persistent backend to a dynamic frontend end-to-end (full request/response cycle)
- Handling real-world UI concerns: loading states, error states, empty states, responsive layout
- Writing clean, maintainable code that communicates architectural intent to future readers
- (Stretch) TypeScript end-to-end: typed API contracts, typed React props, shared types between frontend and backend

---

## Architectural Principles to Carry Forward

- Clean separation of concerns: UI layer, API layer, data layer — each with a single responsibility
- API-first design: backend is self-contained and could serve any client
- Future-proof data model: nullable `user_id` from day one; extensible task schema
- Error consistency: uniform error response format across all API endpoints
- No scope creep: every architectural decision should be tested against "does this serve v1?"
