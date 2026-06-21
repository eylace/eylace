#!/usr/bin/env node
/**
 * CI-friendly runner for the Global SEO end-to-end test flow.
 *
 * - Runs the dedicated SEO test file under Vitest in run-mode (no watch).
 * - Emits JSON + JUnit reports for CI artifacts.
 * - Prints a consistent, machine-readable summary line:
 *     SEO_TESTS_RESULT status=<pass|fail> total=<n> passed=<n> failed=<n> skipped=<n> duration_ms=<n>
 * - Exits 0 on pass, 1 on any failure (so CI fails the job).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const reportsDir = resolve(rootDir, 'reports/seo');
const jsonPath = resolve(reportsDir, 'results.json');
const junitPath = resolve(reportsDir, 'junit.xml');
const testFile = 'src/hooks/__tests__/useSeoSettings.test.tsx';

mkdirSync(reportsDir, { recursive: true });

const args = [
  'vitest',
  'run',
  testFile,
  '--reporter=verbose',
  '--reporter=json',
  '--reporter=junit',
  `--outputFile.json=${jsonPath}`,
  `--outputFile.junit=${junitPath}`,
];

console.log(`[seo-tests] running: bunx ${args.join(' ')}`);
const started = Date.now();
const result = spawnSync('bunx', args, { stdio: 'inherit', cwd: rootDir });
const wallMs = Date.now() - started;

let total = 0, passed = 0, failed = 0, skipped = 0, duration = wallMs;
if (existsSync(jsonPath)) {
  try {
    const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
    total = data.numTotalTests ?? 0;
    passed = data.numPassedTests ?? 0;
    failed = data.numFailedTests ?? 0;
    skipped = (data.numPendingTests ?? 0) + (data.numTodoTests ?? 0);
    if (typeof data.startTime === 'number' && data.testResults?.length) {
      const end = Math.max(...data.testResults.map((r) => r.endTime ?? data.startTime));
      duration = end - data.startTime;
    }
  } catch (err) {
    console.warn('[seo-tests] failed to parse JSON report:', err?.message || err);
  }
}

const status = result.status === 0 && failed === 0 ? 'pass' : 'fail';
console.log(
  `\nSEO_TESTS_RESULT status=${status} total=${total} passed=${passed} ` +
  `failed=${failed} skipped=${skipped} duration_ms=${duration}`
);
console.log(`[seo-tests] reports: ${jsonPath} | ${junitPath}`);

process.exit(status === 'pass' ? 0 : 1);