# Story 4.7: Security Review

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a security review of the codebase covering common vulnerabilities,
so that security posture is documented and any issues are remediated or tracked.

## Acceptance Criteria

1. **Given** the codebase is reviewed for OWASP Top 10 vulnerabilities **When** the review covers XSS, injection, CSRF, insecure dependencies, and error information leakage **Then** findings are documented with severity ratings

2. **Given** the API error handler is reviewed **When** checked **Then** no stack traces, database errors, or internal details are exposed in responses (NFR7 — already implemented, verify)

3. **Given** dependency audit is run (`npm audit`) **When** results are reviewed **Then** critical and high vulnerabilities are documented with remediation status

4. **Given** the security review is complete **When** findings are compiled **Then** a security review document lists all findings, remediations applied, and any accepted risks

## Tasks / Subtasks

- [x] Task 1: OWASP Top 10 codebase review (AC: 1)
  - [x] 1.1 Review XSS protections — verify React's default JSX escaping covers all rendered user input (`text` field in TaskItem), check for any `dangerouslySetInnerHTML` usage, verify API responses are JSON-typed (`Content-Type: application/json`)
  - [x] 1.2 Review SQL injection protections — verify all queries in `TaskRepository.ts` use prepared statements (`db.prepare()`) with parameterized binding, confirm no string interpolation or concatenation in SQL, verify migration file uses static DDL only
  - [x] 1.3 Review CSRF protections — document that CORS (`@fastify/cors` with `CORS_ORIGIN` env var) is the primary cross-origin control, verify SPA-to-API communication uses `Content-Type: application/json` (not browser-default form encoding), note absence of CSRF tokens (acceptable for JSON-only API with CORS)
  - [x] 1.4 Review error information leakage — verify `errorHandler.ts` suppresses stack traces and DB errors for 5xx responses (returns generic "An unexpected error occurred"), verify 4xx responses use `@fastify/sensible` helpers with controlled messages, verify client `useTasks` maps errors to user-facing strings (never exposes raw `Error.message` from 500s)
  - [x] 1.5 Review input validation — verify Fastify JSON Schema on all routes (`createTaskSchema`, `updateTaskSchema`, `taskParamsSchema`) with `additionalProperties: false`, verify `text` field has `minLength: 1`, verify `id` param is typed as `integer`, verify POST handler trims and re-validates whitespace-only text
  - [x] 1.6 Review security misconfigurations — check nginx config for missing security headers (X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy), check Dockerfiles for non-root user execution, check for exposed debug/development endpoints in production
  - [x] 1.7 Review sensitive data exposure — verify `user_id` is never writable via any request body schema (NFR8), verify no `.env` files are committed (check `.gitignore`), verify no secrets/credentials hardcoded in source

- [x] Task 2: Verify API error handler compliance with NFR7 (AC: 2)
  - [x] 2.1 Read `server/plugins/errorHandler.ts` and verify: (a) 5xx errors return `{ statusCode, error, message: "An unexpected error occurred" }` — no stack trace, no DB error details; (b) 4xx errors return `{ statusCode, error, message }` with the specific validation/not-found message; (c) server errors are logged via `fastify.log.error(error)` for debugging
  - [x] 2.2 Verify `healthzRoutes.ts` catch block does not leak DB error details in 503 response — it returns `{ status: "error" }` only
  - [x] 2.3 Verify client-side error handling in `tasksApi.ts` — confirm `toApiError()` creates structured `ApiError` objects, and `useTasks` hook maps them to user-facing strings without exposing raw server messages from 500 responses

- [x] Task 3: Run dependency audit (AC: 3)
  - [x] 3.1 Run `npm audit` at monorepo root — capture full output
  - [x] 3.2 Run `npm audit --workspace=server` — focus on server-side dependencies
  - [x] 3.3 Run `npm audit --workspace=client` — focus on client-side dependencies
  - [x] 3.4 For each critical/high vulnerability found: document CVE, affected package, severity, and remediation status (fixed, deferred with justification, or accepted risk)
  - [x] 3.5 If safe to remediate: run `npm audit fix` and verify no regressions (all tests pass, lint clean)

- [x] Task 4: Compile security review document (AC: 4)
  - [x] 4.1 Create a `## Security Review Findings` section in this story's Dev Notes with a findings table: Category | Finding | Severity | Status (Remediated / Accepted Risk / Deferred)
  - [x] 4.2 Document nginx security header gaps (deferred from story 4-3 code review) with recommended headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`, `Referrer-Policy: strict-origin-when-cross-origin`
  - [x] 4.3 Document any dependency audit findings with remediation actions taken
  - [x] 4.4 Document accepted risks section — items that are out of scope for v1 but should be addressed in future (rate limiting, HTTPS enforcement, CSP, authentication)
  - [x] 4.5 Add remediated items — any security fixes applied during this review

- [x] Task 5: Apply quick-win security remediations (AC: 1, 4)
  - [x] 5.1 Add security headers to `client/nginx.conf` — add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` to the `location /` block (these were flagged as deferred in 4-3 code review)
  - [x] 5.2 Add `maxLength` constraint to `text` field in `createTaskSchema` — prevents oversized task text (defense in depth alongside Fastify's 64KB body limit); recommend `maxLength: 500` to match reasonable task description length
  - [x] 5.3 Verify `.gitignore` includes `*.db`, `server/data/`, `.env`, and `coverage/` — no sensitive files committed

- [x] Task 6: Run full regression suite (AC: 1, 2, 3, 4)
  - [x] 6.1 Run `npm test --workspaces` — all unit tests pass
  - [x] 6.2 Run `npm run lint --workspaces` — zero lint errors
  - [x] 6.3 If any code changes were made, verify no regressions in existing test suites

### Review Follow-ups (AI)

#### Senior Developer Review (AI)

**Review Date:** 2026-04-28
**Outcome:** Changes Requested

**Action Items:**

- [x] [Review][Patch] nginx `add_header` inheritance bug — security headers not sent on any response [`client/nginx.conf`]
- [x] [Review][Patch] `expires 1y` + duplicate `Cache-Control` header conflict [`client/nginx.conf:20-21`]
- [x] [Review][Patch] Missing `server_tokens off` — nginx version disclosure [`client/nginx.conf`]
- [x] [Review][Defer] CSP header missing [`client/nginx.conf`] — deferred, explicitly deferred in spec (complex for Vite SPA)
- [x] [Review][Defer] HSTS header missing [`client/nginx.conf`] — deferred, explicitly deferred in spec (no HTTPS in local/dev)
- [x] [Review][Defer] `Permissions-Policy` header missing [`client/nginx.conf`] — deferred, out of scope for v1
- [x] [Review][Defer] No gzip/brotli compression [`client/nginx.conf`] — deferred, pre-existing, optimization not in scope
- [x] [Review][Defer] `maxLength: 500` unenforced at DB layer — deferred, requires new migration, out of quick-win scope
- [x] [Review][Defer] Unicode supplementary-plane code points inflate byte storage vs code-point count — deferred, theoretical edge case for v1
- [x] [Review][Defer] `id` param accepts negative integers (pre-existing) [`server/routes/schemas/taskSchemas.ts`] — deferred, pre-existing
- [x] [Review][Defer] `updateTaskSchema.params` missing `additionalProperties: false` (pre-existing) — deferred, pre-existing
- [x] [Review][Defer] No response schemas defined (pre-existing) — deferred, pre-existing

## Dev Notes

### CRITICAL: This Is a Review + Document Story — Not a Rewrite

This story is primarily about **auditing and documenting** the security posture. The codebase already implements most security controls correctly. The dev agent should:
1. **Verify** existing security controls work as documented
2. **Document** findings with severity ratings
3. **Apply only quick-win remediations** (nginx headers, schema maxLength) — no major refactors
4. **Track** everything else as accepted risks or future work

### CRITICAL: Existing Security Controls Already in Place

The following controls are already implemented and only need **verification**, not reimplementation:

| Control | Location | Status |
|---------|----------|--------|
| Prepared statements (SQL injection prevention) | `server/repositories/TaskRepository.ts` | ✅ All 5 queries use `db.prepare()` with `?` params |
| Error information suppression (NFR7) | `server/plugins/errorHandler.ts` | ✅ 5xx returns generic message, 4xx returns controlled message |
| JSON Schema validation (NFR9) | `server/routes/schemas/taskSchemas.ts` | ✅ All routes with body/params have schemas with `additionalProperties: false` |
| CORS origin restriction | `server/plugins/cors.ts` | ✅ Reads from `CORS_ORIGIN` env var |
| `user_id` not writable (NFR8) | `server/routes/schemas/taskSchemas.ts` | ✅ `user_id` absent from all request body schemas |
| Non-root Docker containers | `server/Dockerfile`, `client/Dockerfile` | ✅ Both use non-root users (`appuser`, `nginx`) |
| WAL mode on SQLite | `server/plugins/db.ts` | ✅ `db.pragma('journal_mode = WAL')` |
| Client error mapping | `client/src/api/tasksApi.ts` | ✅ `toApiError()` + `isApiError()` create structured errors |
| Fastify body size limit | Default 64KB | ✅ Not explicitly raised |
| React XSS protection | JSX default escaping | ✅ No `dangerouslySetInnerHTML` usage |

### CRITICAL: Known Gaps to Document (NOT Remediate Unless Quick-Win)

These are known gaps, most already flagged in deferred-work.md from previous code reviews:

1. **Nginx security headers** — Missing `X-Frame-Options`, `X-Content-Type-Options`, `CSP`, `Referrer-Policy` in `client/nginx.conf` (flagged in 4-3 review). **Quick-win: add basic headers.**
2. **No rate limiting** — Architecture explicitly defers this: "None in v1 — single user, local/dev deployment". **Document as accepted risk.**
3. **No HTTPS enforcement** — Out of scope for local/dev deployment. **Document as accepted risk.**
4. **No CSP header** — Complex to configure correctly for Vite-bundled SPA with inline scripts. **Document as deferred with recommendation.**
5. **No CSRF tokens** — JSON-only API with CORS is sufficient protection for this app. **Document as accepted risk with rationale.**
6. **No authentication** — Explicitly out of scope for v1 per architecture: "Auth in v1: None — `user_id` reserved but not surfaced via API". **Document as accepted risk.**
7. **Unpinned Docker image tags** — `node:22-alpine`, `nginx:stable-alpine` flagged in 4-3 review. **Document as accepted risk for dev context.**
8. **No `maxLength` on task text** — Schema validates `minLength: 1` but no upper bound. **Quick-win: add `maxLength: 500`.**

### CRITICAL: `npm audit` Execution Notes

- Run `npm audit` from the **monorepo root** — this covers all workspaces
- Focus on **critical** and **high** severity findings only per AC3
- Dev dependencies (test frameworks, build tools) have lower risk profile than production dependencies — document but don't block on dev-only vulnerabilities
- If `npm audit fix` is safe (no major version bumps on production deps), apply it
- **DO NOT run `npm audit fix --force`** — this can introduce breaking changes

### CRITICAL: File Locations for Security Review

| File | Security Relevance |
|------|-------------------|
| `server/plugins/errorHandler.ts` | NFR7 — error information leakage prevention |
| `server/plugins/cors.ts` | Cross-origin request restriction |
| `server/plugins/db.ts` | Database connection, WAL mode, migration execution |
| `server/routes/schemas/taskSchemas.ts` | Input validation, `additionalProperties: false`, type constraints |
| `server/routes/taskRoutes.ts` | Route handlers — verify no raw error exposure, correct status codes |
| `server/routes/healthzRoutes.ts` | Health endpoint — verify no info leakage in error case |
| `server/repositories/TaskRepository.ts` | SQL queries — verify prepared statements only |
| `server/migrations/001_create_tasks.sql` | DDL — verify static SQL, no dynamic content |
| `client/src/api/tasksApi.ts` | Client-side error handling — verify no raw server error exposure to UI |
| `client/nginx.conf` | Nginx security headers, caching headers |
| `server/Dockerfile` | Non-root user, multi-stage build, no secrets in image |
| `client/Dockerfile` | Non-root user, multi-stage build |
| `docker-compose.yml` | Volume mounts, exposed ports, environment variables |
| `.gitignore` | Ensure `.env`, `*.db`, `data/` excluded |
| `server/.env.example` | No actual secrets — only template values |
| `client/.env.example` | No actual secrets — only template values |

### CRITICAL: Security Review Output Format

The findings document should follow this structure:

```markdown
## Security Review Findings

### OWASP Top 10 Assessment

| # | OWASP Category | Status | Details |
|---|---------------|--------|---------|
| A01 | Broken Access Control | N/A (no auth in v1) | ... |
| A02 | Cryptographic Failures | N/A (no sensitive data) | ... |
| A03 | Injection | ✅ Mitigated | Prepared statements in TaskRepository |
| ... | ... | ... | ... |

### Dependency Audit Results
[npm audit output summary]

### Remediations Applied
[List of fixes made during this story]

### Accepted Risks
[Items deferred with justification]
```

### Project Structure Notes

- Security review document is part of **this story file** — no separate document needed
- Nginx config changes go in `client/nginx.conf` — the existing file has `location /` and `location ~* \.(js|css|...)$` blocks
- Schema changes go in `server/routes/schemas/taskSchemas.ts` — the existing `createTaskSchema` body properties
- `.gitignore` is at monorepo root — verify, don't recreate

### Previous Story Intelligence (4-4: Test Coverage Analysis)

From story 4-4 (currently in review):
- All 81 unit tests pass (57 client + 24 server)
- Both coverage checks pass thresholds (client 98.61%, server 100%)
- Zero lint errors
- `run-coverage.mjs` has two open review findings (missing `coverageIncludeGlobs`, unhandled stream error event)
- CI workflow includes coverage steps after unit tests

### Previous Story Learnings from Epic 4

From deferred-work.md:
- **nginx security headers** explicitly flagged as deferred from 4-3 code review — this story should address them
- **Unpinned Docker image tags** flagged from 4-3 — document as accepted risk
- **`CORS_ORIGIN` / `VITE_API_URL` hardcoded as `localhost`** — intentional for local Docker Compose, not a vulnerability

### Git Intelligence

Recent commits show feature implementation pattern (no security-specific commits):
- `5aaed2f` feat: Implement Task Management Features and Error Handling
- `62d6cb3` feat: implement `useTasks` hook
- `394333a` feat: implement unit tests for task route handlers
- `6920e36` feat: implement Fastify plugins for database, CORS, and error handling
- `a846d0c` feat: implement TaskRepository with SQLite schema

The error handler and CORS plugins were implemented in commit `6920e36` — they have been stable since early in the project.

### Testing Standards Summary

Per project-context.md:
- **Co-located tests**: `.test.ts` / `.test.tsx` next to source files
- **Server runner**: `node:test` with `--experimental-test-module-mocks`
- **Client runner**: Vitest via `vitest run`
- If schema changes are made (Task 5.2), existing route tests in `server/routes/taskRoutes.test.ts` must still pass — the test already validates schema rejection of invalid input

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 4.7 section]
- [Source: _bmad-output/planning-artifacts/architecture.md — Authentication & Security section]
- [Source: _bmad-output/planning-artifacts/architecture.md — Error Handling Process Patterns]
- [Source: _bmad-output/project-context.md — Security section, Anti-Patterns table]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md — nginx security headers, unpinned images]
- [Source: server/plugins/errorHandler.ts — NFR7 implementation]
- [Source: server/plugins/cors.ts — CORS configuration]
- [Source: server/routes/schemas/taskSchemas.ts — JSON Schema validation]
- [Source: server/repositories/TaskRepository.ts — prepared statements]
- [Source: client/nginx.conf — current nginx configuration]
- [Source: server/Dockerfile — non-root user, multi-stage build]
- [Source: client/Dockerfile — non-root user, multi-stage build]
- [Source: OWASP Top 10 2021 — https://owasp.org/Top10/]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Security Review Findings

#### OWASP Top 10 Assessment

| # | OWASP Category | Status | Details |
|---|---------------|--------|---------|
| A01 | Broken Access Control | N/A | No auth in v1 — `user_id` reserved but not exposed via API (NFR8 verified) |
| A02 | Cryptographic Failures | N/A | No sensitive data stored/transmitted; no passwords, tokens, or PII |
| A03 | Injection | ✅ Mitigated | All 5 SQL queries in `TaskRepository.ts` use `db.prepare()` with parameterized `?` binding. No string interpolation. Migration file is static DDL only |
| A04 | Insecure Design | ✅ N/A | Simple CRUD app with defense-in-depth: schema validation, prepared statements, error suppression |
| A05 | Security Misconfiguration | ⚠️ Partial | Nginx missing security headers (REMEDIATED), Docker containers run as non-root ✅, no debug endpoints exposed ✅ |
| A06 | Vulnerable Components | ✅ Clean | `npm audit` reports 0 vulnerabilities across all workspaces |
| A07 | Auth Failures | N/A | No authentication in v1 (by design) |
| A08 | Software/Data Integrity | ✅ OK | Multi-stage Docker builds, npm ci with lockfile, no dynamic script loading |
| A09 | Logging & Monitoring | ✅ OK | Server errors logged via `fastify.log.error(error)` (Pino); 5xx responses suppressed from clients |
| A10 | SSRF | N/A | No outbound requests from server; client fetch targets configured `VITE_API_URL` only |

#### Dependency Audit Results

| Workspace | Command | Result |
|-----------|---------|--------|
| Root (all) | `npm audit` | 0 vulnerabilities |
| Server | `npm audit --workspace=server` | 0 vulnerabilities |
| Client | `npm audit --workspace=client` | 0 vulnerabilities |

No remediation needed. All dependencies are clean as of 2026-04-28.

#### Remediations Applied

| # | Finding | Fix | File |
|---|---------|-----|------|
| 1 | Missing nginx security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) | Added `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` at server block level | `client/nginx.conf` |
| 2 | No `maxLength` on task text input (unbounded string with only `minLength: 1`) | Added `maxLength: 500` to `createTaskSchema.body.properties.text` | `server/routes/schemas/taskSchemas.ts` |

#### Accepted Risks

| # | Risk | Rationale | Future Recommendation |
|---|------|-----------|----------------------|
| 1 | No rate limiting | Single-user local/dev deployment; architecture explicitly defers this | Add `@fastify/rate-limit` when deploying to production |
| 2 | No HTTPS enforcement | Local Docker Compose context; TLS terminates at reverse proxy/platform in production | Enforce via platform (Railway, Vercel) or add HSTS header |
| 3 | No Content-Security-Policy header | Complex to configure for Vite-bundled SPA (inline scripts, hashed chunks) | Add CSP with `script-src 'self'` + nonce/hash strategy in production |
| 4 | No CSRF tokens | JSON-only API with CORS restriction is sufficient — browsers won't send JSON content-type cross-origin without CORS preflight approval | Re-evaluate if form-encoded endpoints are added |
| 5 | No authentication | Explicitly out of scope for v1 per architecture; `user_id` column reserved for future multi-user support | Implement auth (JWT/session) before any multi-user or public deployment |
| 6 | Unpinned Docker base image tags | `node:22-alpine`, `nginx:stable-alpine` — acceptable in dev context for automatic security patches | Pin to digest in production CI for reproducibility |
| 7 | CORS_ORIGIN defaults to localhost | Fallback `'http://localhost:5173'` is intentional for local dev; production must set env var explicitly | Fail-closed if `CORS_ORIGIN` is unset in production (`NODE_ENV=production`) |

### Debug Log References

### Completion Notes List

- Completed full OWASP Top 10 codebase review — all 10 categories assessed
- Verified NFR7 (error information suppression) compliance across server error handler, healthz routes, and client error handling
- Dependency audit: 0 vulnerabilities across all workspaces (root, server, client)
- Applied 2 quick-win remediations: nginx security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) and `maxLength: 500` on task text schema
- Documented 7 accepted risks appropriate for v1 local/dev deployment (rate limiting, HTTPS, CSP, CSRF tokens, auth, Docker image pinning, CORS default)
- Full regression suite passes: 81 tests (57 client + 24 server), 0 lint errors

### File List

- `client/nginx.conf` — added security headers in each location block (X-Frame-Options, X-Content-Type-Options, Referrer-Policy), added server_tokens off, replaced expires+duplicate Cache-Control with single max-age=31536000 header
- `server/routes/schemas/taskSchemas.ts` — added `maxLength: 500` to `createTaskSchema.body.properties.text`

### Change Log

- 2026-04-28: Security review completed. Added nginx security headers and task text maxLength constraint. Documented OWASP assessment, dependency audit results, remediations, and accepted risks.
- 2026-04-28: Code review patches applied. Fixed nginx add_header inheritance (headers now in each location block), replaced expires+duplicate Cache-Control with single max-age header, added server_tokens off.
