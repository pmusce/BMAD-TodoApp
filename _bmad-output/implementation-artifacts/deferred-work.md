# Deferred Work

## Deferred from: code review of 4-7-security-review (2026-04-28)

- `client/nginx.conf` — CSP header not added (complex to configure for Vite-bundled SPA with inline scripts; explicitly deferred in spec)
- `client/nginx.conf` — HSTS (`Strict-Transport-Security`) not added (HTTPS out of scope for local/dev deployment; explicitly deferred in spec)
- `client/nginx.conf` — `Permissions-Policy` header not added (deny-by-default for camera/mic/geo; out of scope for v1)
- `client/nginx.conf` — No gzip/brotli compression configured (optimization, out of scope for this story)
- `server/routes/schemas/taskSchemas.ts` — `maxLength: 500` has no DB-layer enforcement (`tasks.text` column is unbounded TEXT); requires new migration with `CHECK(length(text) <= 500)`; deferred as out of quick-win scope
- `server/routes/schemas/taskSchemas.ts` — Unicode supplementary-plane characters (4-byte emoji etc.) count as 1 code point in JSON Schema `maxLength` but up to 4 bytes in SQLite storage; theoretical amplification edge case for v1
- `server/routes/schemas/taskSchemas.ts` — `id` params (`updateTaskSchema.params`, `taskParamsSchema.params`) accept negative integers; `minimum: 1` not enforced (pre-existing)
- `server/routes/schemas/taskSchemas.ts` — `updateTaskSchema.params` missing `additionalProperties: false` (pre-existing inconsistency)
- `server/routes/schemas/taskSchemas.ts` — No response schemas on any route (Fastify serialization acceleration + output validation; pre-existing)



- No test cleanup / orphaned tasks accumulate in E2E test database — pre-existing pattern across all E2E test files; not introduced by this story
- `test:perf` and `test:coverage` scripts in root `package.json` — belong to stories 4-5 and 4-4 respectively; out of scope for 4-6

## Deferred from: code review of 4-5-performance-testing (2026-04-28)

- `e2e/tests/performance.spec.ts:8` — `appendInteractionTiming` merge-vs-overwrite ordering: Lighthouse test overwrites full JSON; interaction tests merge into it. Safe for normal sequential run; partial `--grep` runs produce incomplete JSON. Low risk for local analysis tool.
- `e2e/tests/performance.spec.ts:5` — `process.cwd()` for REPORT_DIR: works from monorepo root; would silently write to wrong path if run from `e2e/` directory. Low risk given documented `npm run test:perf` entrypoint.
- `package.json` — `test:a11y`, `@axe-core/playwright`, `test:coverage` changes visible in diff belong to stories 4-6 and 4-4; not part of 4-5 scope; reviewed with those stories.

## Deferred from: code review of 4-4-test-coverage-analysis (2026-04-28)

- `server/run-coverage.mjs`: `run()` has no explicit files glob — auto-discovery consistent with existing `npm test` pattern; acceptable until test structure changes
- CI runs unit tests and coverage steps separately — tests execute twice (~30s overhead); by design per spec; revisit if CI time becomes a concern
- No coverage artifact upload in CI — `actions/upload-artifact` not added; useful for PR comments/badges but out of scope for this story
- `client/vite.config.ts`: coverage config omits `reporter` — no HTML/LCOV output; add when coverage reporting dashboard is needed
- Root `package.json` `test:coverage` uses manual `&&` chaining — new workspaces added in future will be silently excluded; low risk for current project size

## Deferred from: code review of 4-3-dockerfiles-and-docker-compose (2026-04-28)

- Dev/prod port conflict: `server` (no profile) and `server-dev` (profile: dev) both bind port 3000; decided to document mutual exclusivity in README rather than change Compose profiles
- Unpinned image tags (`node:22-alpine`, `nginx:stable-alpine`) — reproducibility risk; acceptable for development context
- nginx missing security headers (X-Frame-Options, CSP, Referrer-Policy) — valid hardening; out of story scope
- `CORS_ORIGIN` / `VITE_API_URL` hardcoded as `localhost` — spec explicitly notes intentional for local-only Docker Compose setup; defer to a deployment/production story
- `server/routes/healthzRoutes.ts`: `SELECT 1` doesn't verify migrations have run — spec requires DB accessibility check only, not schema validation
- `server-dev` runs `npm ci` on every container start — dev DX concern, not a correctness issue
- `client/Dockerfile` npm ci layer cache order — minor optimization; npm install before full source copy would improve layer caching
- gzip/brotli compression missing from nginx config — optimization, not in spec
- `healthzRoutes.ts` catch block swallows TypeErrors alongside SqliteErrors — acceptable for a health-check endpoint; 503 on any error is fine

## Deferred from: code review of 4-2-readme-and-architecture-decision-summary (2026-04-28)

- `styles/` directory omitted from README project structure tree — `client/src/styles/index.css` exists but tree is intentionally abbreviated; cosmetic
- `shared/types.test.ts` omitted from README project structure under `shared/` — tree is intentionally abbreviated; cosmetic

## Deferred from: code review of 4-1-playwright-e2e-test-specs (2026-04-28)

- Add dedicated `/healthz` endpoint to Fastify instead of coupling webServer health-check to `/api/tasks` business route
- Replace CSS class selectors (`.task-text--completed`, `.task-item`) in E2E tests with `data-testid` or ARIA role selectors for less brittle coupling
- Add mutation-failure E2E coverage — `apiFailure.spec.ts` only tests GET /api/tasks 500; no coverage for POST/PATCH/DELETE failures
- Add test data cleanup between E2E runs — tasks accumulate in SQLite; consider `beforeEach` API cleanup or DB reset
- Wait for PATCH/DELETE round-trip responses in `completeTask`/`deleteTask` specs (currently only POST is awaited)
- Guard against trailing slash in `VITE_API_URL` producing double-slash URLs
- Missing subtask assertions: `deleteTask` doesn't assert empty-state; `apiFailure` doesn't assert empty-state is hidden (ACs still pass)

## Deferred from: code review of 3-7-spa-routing-homepage-and-global-styles (2026-04-28)

- `index.css`: Native `[type="checkbox"]` `min-width/min-height` sizing does not reliably enlarge the tap hit area in WebKit/Safari — the visual checkbox remains ~16×16px and the extra space is passive. Story AC6 specifies "computed CSS size", which passes; a robust cross-browser approach would use an invisible `::after` overlay or size the `<label>` instead. Defer to a design/accessibility hardening pass.
- `index.css`: `.task-list*` / `.task-error-banner` styles appear in the Story 3.7 diff because they were added in the working tree by Story 3.5 but never committed. They are correct and should be committed as part of the overall story history; no change required.
- `HomePage.tsx`: No visible `<h1>` page heading or app title in the rendered output. Not required by story ACs or WCAG 2.1 Level A; defer to a future UX / design-token pass when application branding is decided.

## Deferred from: code review of 3-5-tasklist-component (2026-04-28)

- `TaskList.tsx`: Empty-state message ("No tasks yet") renders alongside the error banner when `tasks=[]` and `error` is non-null — correct UX for failed-first-task scenario; revisit if product design specifies a different empty+error state treatment
- `index.css`: Hardcoded hex colors in TaskList styles (e.g. `#444`, `#888`, `#721c24`) — no CSS variable system or contrast verification; defer to a global styling/design-token pass
- `TaskList.test.tsx`: `getAllByRole('listitem')` in reverse-chrono test is fragile if completed tasks are colocated in the same query — functional for the specific test case; tighten selector scope if test failures emerge after Story 3.6/3.7 add more list items

## Deferred from: code review of 3-4-taskitem-component (2026-04-28)

- `TaskItem.tsx:16`: `Intl.RelativeTimeFormat` instantiated on every render — move to a module-level constant for minor allocation savings; no functional impact for v1
- `TaskItem.tsx`: No in-flight guard for double-click on toggle/delete — intentional per optimistic UI architecture; `useTasks` handles concurrent mutation state
- Touch targets ≥ 44×44 CSS px (FR27) — not implemented in `TaskItem`; explicitly an AC of Story 3.7 (`SPA Routing, HomePage, and Global Styles`)

## Deferred from: code review of 3-3-taskinput-component (2026-04-28)

- `TaskInput`: focus not restored when `createTask` prop rejects — `inputRef.current?.focus()` is only reached if `await createTask(trimmed)` resolves; in the current architecture `useTasks.createTask` never re-throws so this is unreachable, but if the prop contract ever changes the focus is silently not restored on failure. Add try/finally or ensure `focus()` runs unconditionally if the prop contract is widened.

## Deferred from: code review of 3-2-usetasks-hook (2026-04-28)

- Stale snapshot / ghost-restore under concurrent mutations (e.g. deleteTask double-click): failed rollback restores pre-optimistic state wiping a concurrent committed change — requires mutation queue or abort logic beyond story scope [useTasks.ts:19,54]
- `toggleTask` stale `.completed` under rapid double-call: both calls read same closure-bound value and send duplicate PATCH requests, leaving UI and server out of sync — concurrent mutation concern beyond story scope [useTasks.ts:41]

## Deferred from: code review of 2-4-server-route-unit-tests (2026-04-28)

- `noEmit: true` in `server/tsconfig.json` means `npm run build` (tsc) emits nothing — root cause: production files use `.ts` import extensions which require `allowImportingTsExtensions` which requires `noEmit`; Node.js v24 native TS runs these fine, but a compiled production build needs a non-tsc toolchain (esbuild, tsx, or switching to `.js` imports with a Node.js loader); defer to a future infra story when deployment strategy is finalised
- `--experimental-test-module-mocks` Node.js flag is subject to API changes until it stabilises; pin Node.js version in CI and watch for deprecation when upgrading
- `DELETE /api/tasks/:id` returns 204 for non-existent IDs (story specifies happy-path only); add 404 guard if delete-on-missing-id semantics are hardened in a future story

## Deferred from: code review of 2-3-task-route-handlers-with-json-schema-validation (2026-04-28)

- No response schema on any task route — not a correctness issue, pre-existing pattern; add response schemas for serialization performance and validation in a future hardening story
- Params schema `id` has no `minimum: 1` — negative/zero IDs pass AJV but repo returns undefined/false; add `minimum: 1` when ID validation standards are formalized
- Dual-layer whitespace validation (schema `minLength:1` + handler trim guard) — intentional design, documented in story dev notes; could cause inconsistent 400 messages; revisit when API contract is stabilized

## Deferred from: code review of 2-2-fastify-plugins-db-cors-error-handler (2026-04-28)

- `cors.ts`: `CORS_ORIGIN ?? fallback` does not catch empty-string env var — use `||` or startup validation if multi-env deployment is required
- `errorHandler.ts`: No structured logging for 4xx client errors — add `fastify.log.warn(error)` for client errors when audit logging is needed
- All plugins: No `name` metadata on `fp()` wrappers — add `{ name: 'db-plugin' }` etc. for clearer Fastify dependency debug output

## Deferred from: code review of 2-1-sqlite-schema-and-taskrepository (2026-04-28)

- `update()` get-check-update-get pattern has no transaction wrapper — better-sqlite3 is synchronous so no actual race today; revisit if async SQLite is ever adopted
- `create()` uses non-null assertion `row!` after `findByIdStmt.get(lastInsertRowid)` — unreachable in practice but adds brittleness; add a throw guard in a future hardening pass
- Stateful test suite — tests 3-6 depend on shared DB state; single failure cascades; acceptable for small in-memory integration tests, refactor when test count grows
- `SELECT *` in `findAll` / `findByIdStmt` — implicit column dependency; use explicit column list when new schema migrations are introduced
- `updateStmt` only updates `completed` field — `text` update not possible; extend when edit-text is a product requirement

## Deferred from: code review of 1-6-github-actions-ci-configuration (2026-04-27)

- No `pull_request` trigger in `.github/workflows/ci.yml` — spec scopes to `push` only; add PR trigger in a future CI hardening story
- No Playwright HTML report artifact upload in `.github/workflows/e2e.yml` — add `actions/upload-artifact` step in Epic 4 when real E2E tests are written
- `node --test *.ts` (via `test:shared`) relies on Node 22 implicit TypeScript stripping — works on Node 22.12+ LTS; confirm or add `--experimental-strip-types` flag if CI runner Node version is ever pinned to < 22.6
- No `concurrency` group on either workflow — add `concurrency: cancel-in-progress: true` to avoid wasted runner minutes as test suite grows
- No `permissions` block for GITHUB_TOKEN on either workflow — add `permissions: contents: read` in a future security hardening story

## Deferred from: code review of 1-3-backend-workspace-bootstrap (2026-04-27)

- `server/package.json` has stale scaffold boilerplate (description, keywords, author, license) — cosmetic, not actionable now
- `tsconfig.base.json` `"lib": ["DOM"]` is inherited by the server workspace — pre-existing base config issue; server doesn't use DOM; low priority
- No `"engines"` field in `server/package.json` — `import.meta.dirname` requires Node ≥21; silent failure on older runtimes. Add in a future hardening story.

## Deferred from: code review of 1-4-shared-types-foundation (2026-04-27)

- `fastify-cli` missing from `server/package.json` devDependencies — `dev` script uses `fastify start` but the package is absent; Story 1-3 scaffold gap
- `eslint` missing from `server/package.json` devDependencies — `lint` script will fail in CI; Story 1-3 scaffold gap
- `--ext .ts` lint flag unsupported in ESLint v9 — `eslint . --ext .ts` is a no-op/error in ESLint ≥9; fix when ESLint is properly installed
- `pino-pretty` in runtime `dependencies` instead of `devDependencies` — dev-only formatter shipped to production; move in a future hardening story
- `@types/node ^25.0.3` targets non-LTS Node.js release — may introduce type stubs absent from LTS Node 22; pin to `^22.0.0` in a future dependencies audit
- `rootDir: ".."` + `node build/server/server.js` coupling — intentional NodeNext cross-workspace fix; document clearly for any future tsconfig changes
- No CI-integrated test script for `shared/types.test.ts` — `shared/` is not an npm workspace so `--workspaces` skips it; add a root-level `test:shared` script in a CI setup story
- `@ts-expect-error` negative shape tests not present — type constraint rejection is untested; add in a future type-safety hardening story

## Deferred from: code review of 1-5-playwright-e2e-scaffold (2026-04-27)

- `baseURL: 'http://localhost:5173'` hardcoded in `e2e/playwright.config.ts` — no `process.env.BASE_URL` override; breaks in Docker or remote dev environments; acceptable for single-dev local scaffold, add env-var fallback in a future hardening story
- `reuseExistingServer: !process.env.CI` is falsy when `CI=''` (empty string) — edge case in some CI systems; most set `CI=true` or `CI=1`; impact is low; revisit if CI provider uses `CI=''` convention
- No `outputDir` configured in playwright.config.ts — `test-results/` and `playwright-report/` land at monorepo root; scoping under `e2e/` would be cleaner; gitignore already covers root-level paths; defer to Epic 4
- No `retries` setting — acceptable for stub scaffold; add `retries: process.env.CI ? 2 : 0` when real tests are written in Epic 4
