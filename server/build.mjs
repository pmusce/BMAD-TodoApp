/**
 * Production build script for the server.
 *
 * Why esbuild instead of tsc:
 *   server/tsconfig.json uses `allowImportingTsExtensions: true` (required for
 *   NodeNext + .ts extension imports) which forces `noEmit: true` in tsc.
 *   esbuild handles .ts extension imports natively and produces real JS output.
 *
 * Usage:
 *   npm run build          → compile to build/server/
 *   npm run typecheck      → type-check only (tsc --noEmit), no output
 */
import { build } from 'esbuild'
import { readdirSync, statSync, cpSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function findTsFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'build'].includes(entry)) continue
    const fullPath = join(dir, entry)
    if (statSync(fullPath).isDirectory()) {
      results.push(...findTsFiles(fullPath))
    } else if (
      entry.endsWith('.ts') &&
      !entry.endsWith('.d.ts') &&
      !entry.endsWith('.test.ts')
    ) {
      // Return path relative to server/ directory
      results.push(fullPath.slice(__dirname.length))
    }
  }
  return results
}

const entryPoints = findTsFiles(__dirname)
console.log(`Building ${entryPoints.length} files → build/server/`)

await build({
  entryPoints,
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'build/server',
  outbase: '.',
  packages: 'external',
  // Resolve @shared/* path alias (mirrors tsconfig.base.json paths)
  alias: {
    '@shared/types': resolve(__dirname, '../shared/types.ts'),
    '@shared/types.js': resolve(__dirname, '../shared/types.ts'),
  },
  plugins: [
    {
      // Rewrite local .ts imports → .js in the compiled output so that
      // Node.js ESM can resolve them without TypeScript stripping at runtime.
      name: 'rewrite-ts-to-js',
      setup(build) {
        build.onResolve({ filter: /\.ts$/ }, (args) => {
          if (args.importer) {
            return {
              path: args.path.replace(/\.ts$/, '.js'),
              external: true,
            }
          }
        })
      },
    },
  ],
})

console.log('Build complete.')

// Copy static assets needed at runtime
mkdirSync('build/server/migrations', { recursive: true })
cpSync('migrations', 'build/server/migrations', { recursive: true })
console.log('Copied migrations/ → build/server/migrations/')
