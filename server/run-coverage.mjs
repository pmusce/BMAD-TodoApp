import { run } from 'node:test';
import { spec } from 'node:test/reporters';

const stream = run({
  coverage: true,
  lineCoverage: 70,
  branchCoverage: 0,
  functionCoverage: 0,
  coverageIncludeGlobs: ['routes/**', 'repositories/**'],
});

stream.compose(spec).pipe(process.stdout);
stream.on('test:fail', () => { process.exitCode = 1; });
stream.on('error', (err) => { console.error(err); process.exitCode = 1; });
