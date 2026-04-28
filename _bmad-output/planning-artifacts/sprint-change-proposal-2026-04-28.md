# Sprint Change Proposal — Docker Compose + Expanded QA

**Date:** 2026-04-28  
**Trigger:** New stakeholder requirements received during Epic 4 execution  
**Scope classification:** Moderate  

---

## 1. Issue Summary

During Epic 4 implementation (stories 4-1 and 4-2 already done), the project received new requirements that change the remaining scope:

1. **Containerization with Docker Compose** replaces Vercel + Railway cloud deployment (story 4-3)
2. **Health check endpoints** must be added to the backend for container health monitoring
3. **Expanded QA activities** replace the narrow test-coverage-gate story (story 4-4) with four distinct QA concerns: coverage (now ≥70%), performance testing, accessibility auditing, and security review
4. **Coverage target lowered** from ≥80% (original PRD) to ≥70%

**Category:** New requirements from stakeholder — not a failure or technical limitation.

---

## 2. Impact Analysis

### Epic Impact

| Epic | Impact |
|------|--------|
| Epic 1–3 | **None** — all done, no rollback needed |
| Epic 4 | **Modified** — stories 4-3 and 4-4 replaced; new stories added |

Epic 4's title shifts from "Quality Gates & Production Deployment" to **"Quality Gates & Containerization"**. No new epic is needed — the work fits within Epic 4's purpose.

### Artifact Conflicts

#### PRD

| Section | Current | Proposed |
|---------|---------|----------|
| Deployment line (Additional Requirements) | "Deployment: Vercel (frontend SPA) + Railway (backend with persistent SQLite volume)" | "Deployment: Docker Compose (multi-container local/dev orchestration; no cloud deployment in v1)" |
| Test coverage target (Technical Success, FR31) | ≥80% | ≥70% |
| Measurable Outcomes table — Code quality row | "≥80% test coverage on core logic" | "≥70% test coverage on core logic" |
| Quality Risks section | References "≥80% test coverage" as hard pass criterion | Update to ≥70% |
| User Journey 4 (Lorenzo) | References 82% coverage | Update to ~75% |

#### Architecture

| Section | Change |
|---------|--------|
| Infrastructure & Deployment table | Replace Vercel/Railway rows with Docker Compose row |
| Decision Impact — item 7 | "Deployment config — Vercel + Railway + GitHub Actions CI" → "Containerization — Dockerfiles + docker-compose.yml + GitHub Actions CI" |
| Deployment Integration Points | Replace Vercel/Railway descriptions with Docker Compose networking/volume descriptions |
| Architecture Validation table | Update Railway references |

#### Epics

| Story | Change |
|-------|--------|
| 4-3 | **Replace entirely**: "Vercel & Railway Deployment Configuration" → "Dockerfiles & Docker Compose" |
| 4-4 | **Replace entirely**: "Test Coverage Gate Verification" → split into 4 stories: 4-4 (Coverage), 4-5 (Performance), 4-6 (Accessibility), 4-7 (Security) |

#### CI/CD

| File | Change |
|------|--------|
| `.github/workflows/e2e.yml` | No change needed (runs Playwright, not deployment) |
| `.github/workflows/ci.yml` | Add coverage gate step (≥70% threshold) — was planned for story 4-4 |

---

## 3. Recommended Approach

**Direct Adjustment** — modify existing stories within Epic 4.

**Rationale:**
- Epics 1–3 are untouched; only the remaining backlog stories (4-3, 4-4) need replacement
- No rollback of completed work required
- Docker Compose and QA tasks are additive — they extend the project without breaking existing code
- The scope increase (2 stories → 5 stories) is manageable since the core application is already complete
- Effort: **Medium** — Docker and QA are new concerns but well-bounded
- Risk: **Low** — no existing functionality is at risk

---

## 4. Detailed Change Proposals

### 4A. Story 4-3: REPLACE

**OLD — Story 4.3: Vercel & Railway Deployment Configuration**

_(entire story removed)_

**NEW — Story 4.3: Dockerfiles & Docker Compose**

As a developer,  
I want multi-stage Dockerfiles for frontend and backend plus a `docker-compose.yml` orchestrating all containers,  
So that the entire application can be built and run in containers with a single command.

**Acceptance Criteria:**

**Given** `server/Dockerfile` exists  
**When** reviewed  
**Then** it uses a multi-stage build (build stage + production stage), runs as a non-root user, includes a `HEALTHCHECK` instruction pointing to `/api/healthz`, and copies only production artifacts to the final image

**Given** `client/Dockerfile` exists  
**When** reviewed  
**Then** it uses a multi-stage build (build stage + nginx stage), runs as a non-root user, and serves the built SPA via nginx with a health check

**Given** `GET /api/healthz` is called on the backend  
**When** the server is running and the database is accessible  
**Then** the response is `200` with `{ "status": "ok" }` — when the database is not accessible the response is `503` with `{ "status": "error" }`

**Given** `docker-compose.yml` exists at the monorepo root  
**When** reviewed  
**Then** it defines services for `client` and `server`, configures a shared network, mounts a named volume for SQLite persistence at `server/data/`, and exposes ports 5173 (client) and 3000 (server)

**Given** `docker compose up --build` is run from the monorepo root  
**When** both containers start  
**Then** the frontend is accessible at `http://localhost:5173`, the backend at `http://localhost:3000`, and tasks can be created/read/updated/deleted through the UI

**Given** `docker compose logs` is run  
**When** containers are running  
**Then** both container logs are accessible and health status is visible

**Given** `.env.example` files are reviewed  
**When** checked  
**Then** all environment variables needed for Docker operation are documented

**Given** Docker Compose profiles are configured  
**When** `docker compose --profile dev up` is run  
**Then** dev-specific settings apply (e.g., source volume mounts for hot-reload); `docker compose --profile test up` runs the test suite in containers

---

### 4B. Story 4-4: REPLACE

**OLD — Story 4.4: Test Coverage Gate Verification**

_(entire story removed — coverage verification is retained as new story 4-4 below with lowered threshold)_

**NEW — Story 4.4: Test Coverage Analysis (≥70%)**

As a developer,  
I want verified ≥70% test coverage for core business logic and identified gaps documented,  
So that the coverage requirement is formally met and gaps are visible for future work.

**Acceptance Criteria:**

**Given** `npm run test:coverage` is run in `client/`  
**When** the coverage report is generated  
**Then** line and branch coverage across `src/hooks/` and `src/components/` is ≥70%

**Given** server tests are run with coverage  
**When** the coverage report is generated  
**Then** line coverage across `src/routes/` and `src/repositories/` is ≥70%

**Given** the `ci.yml` GitHub Actions workflow is reviewed  
**When** checked  
**Then** it includes a coverage check step that fails the build if coverage drops below 70%

**Given** coverage gaps are identified  
**When** analyzed  
**Then** a brief gap analysis is documented listing untested paths and rationale for deferral

---

### 4C. NEW — Story 4.5: Performance Testing

As a developer,  
I want application performance analyzed and documented,  
So that performance baselines are established and any issues are visible.

**Acceptance Criteria:**

**Given** Chrome DevTools or Lighthouse performance audit is run against the running application  
**When** the audit completes  
**Then** key metrics are captured: First Contentful Paint (FCP), Largest Contentful Paint (LCP), Total Blocking Time (TBT), Cumulative Layout Shift (CLS)

**Given** the performance metrics are reviewed  
**When** checked against project NFRs  
**Then** CLS < 0.1 (NFR4), UI interactions < 300ms (NFR1), initial load < 1.5s (NFR2) are verified or deviations documented

**Given** a performance report is produced  
**When** reviewed  
**Then** it documents findings, any issues found, and recommended remediations

---

### 4D. NEW — Story 4.6: Accessibility Testing

As a developer,  
I want automated accessibility audits run against the application,  
So that WCAG 2.1 Level AA compliance is verified and violations are documented.

**Acceptance Criteria:**

**Given** an accessibility audit is run using Lighthouse or axe-core (via Playwright)  
**When** the audit completes  
**Then** results are captured covering: color contrast, keyboard navigation, ARIA attributes, focus management, semantic HTML

**Given** the audit results are reviewed  
**When** checked against project NFRs  
**Then** WCAG 2.1 Level A compliance (NFR14) is verified; Level AA findings are documented as stretch

**Given** violations are found  
**When** reviewed  
**Then** each violation is categorized by severity and has a documented remediation plan or deferral justification

---

### 4E. NEW — Story 4.7: Security Review

As a developer,  
I want a security review of the codebase covering common vulnerabilities,  
So that security posture is documented and any issues are remediated or tracked.

**Acceptance Criteria:**

**Given** the codebase is reviewed for OWASP Top 10 vulnerabilities  
**When** the review covers XSS, injection, CSRF, insecure dependencies, and error information leakage  
**Then** findings are documented with severity ratings

**Given** the API error handler is reviewed  
**When** checked  
**Then** no stack traces, database errors, or internal details are exposed in responses (NFR7 — already implemented, verify)

**Given** dependency audit is run (`npm audit`)  
**When** results are reviewed  
**Then** critical and high vulnerabilities are documented with remediation status

**Given** the security review is complete  
**When** findings are compiled  
**Then** a security review document lists all findings, remediations applied, and any accepted risks

---

## 5. PRD Updates Required

| Location | Old | New |
|----------|-----|-----|
| Technical Success — coverage line | "≥ 80% on business logic and API endpoints" | "≥ 70% on business logic and API endpoints" |
| Measurable Outcomes table — Code quality | "≥80% test coverage" | "≥70% test coverage" |
| Additional Requirements — Deployment line | "Deployment: Vercel (frontend SPA) + Railway (backend with persistent SQLite volume)" | "Deployment: Docker Compose (multi-container orchestration; no cloud deployment in v1)" |
| Quality Risks — coverage reference | "≥80% test coverage" | "≥70% test coverage" |
| FR31 | "automated test coverage of ≥80%" | "automated test coverage of ≥70%" |
| User Journey 4 — coverage number | "82%" | "~75%" |

---

## 6. Architecture Updates Required

| Section | Change |
|---------|--------|
| Technical Constraints — Deployment target | "TBD" → "Docker Compose (local/dev multi-container orchestration)" |
| Infrastructure & Deployment table | Replace Vercel row → "Frontend container: nginx serving Vite build"; Replace Railway row → "Backend container: Node.js running Fastify"; Add Docker Compose row |
| Decision Impact — item 7 | "Deployment config — Vercel + Railway + GitHub Actions CI" → "Containerization — Dockerfiles + docker-compose.yml + GitHub Actions CI" |
| Deployment Integration Points | Replace Vercel/Railway content with Docker Compose networking + volumes description |
| Monitoring row | "Railway dashboard" → "Docker health checks + `docker compose logs`" |

---

## 7. Sprint Status Updates Required

Replace stories 4-3 and 4-4; add 4-5, 4-6, 4-7:

```yaml
  # ── Epic 4: Quality Gates & Containerization ──────────────────────────
  epic-4: in-progress
  4-1-playwright-e2e-test-specs: done
  4-2-readme-and-architecture-decision-summary: done
  4-3-dockerfiles-and-docker-compose: backlog
  4-4-test-coverage-analysis: backlog
  4-5-performance-testing: backlog
  4-6-accessibility-testing: backlog
  4-7-security-review: backlog
  epic-4-retrospective: optional
```

---

## 8. Implementation Handoff

**Scope:** Moderate — backlog reorganization + artifact updates needed before dev begins.

**Sequence:**
1. **Artifact updates** (PRD, Architecture, Epics, Sprint Status) — apply the edits above
2. **Create story 4-3** (`bmad-create-story`) → validate → dev → code review
3. **Create story 4-4** → validate → dev → code review
4. **Create stories 4-5, 4-6, 4-7** → validate → dev → code review (these three can be done in any order)
5. **Optional Epic 4 retrospective**

**Agent routing:**
- PRD/Architecture/Epics edits → can be applied directly by Developer agent
- Story creation → `bmad-create-story` workflow
- Implementation → `bmad-dev-story` workflow
- Review → `bmad-code-review` workflow
