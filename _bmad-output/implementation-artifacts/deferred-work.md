# Deferred Work

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
