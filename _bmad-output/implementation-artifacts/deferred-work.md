# Deferred Work

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
