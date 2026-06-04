import fs from 'node:fs'

const reportPath = process.argv[2]
if (!reportPath || !fs.existsSync(reportPath)) {
  console.error(`[kpi] report file not found: ${reportPath ?? '(missing arg)'}`)
  process.exit(1)
}

const raw = fs.readFileSync(reportPath, 'utf8')
let report
try {
  report = JSON.parse(raw)
} catch {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    console.error('[kpi] could not locate JSON payload in report output')
    process.exit(1)
  }
  report = JSON.parse(raw.slice(start, end + 1))
}

const counters = {
  passed: 0,
  failed: 0,
  skipped: 0,
  timedOut: 0,
  interrupted: 0,
}

function walkSuite(suite) {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const latest = (test.results ?? []).at(-1)
      const status = latest?.status ?? test.status
      if (status === 'passed') counters.passed += 1
      else if (status === 'failed') counters.failed += 1
      else if (status === 'skipped') counters.skipped += 1
      else if (status === 'timedOut') counters.timedOut += 1
      else if (status === 'interrupted') counters.interrupted += 1
    }
  }
  for (const child of suite.suites ?? []) {
    walkSuite(child)
  }
}

for (const suite of report.suites ?? []) {
  walkSuite(suite)
}

const executed = counters.passed + counters.failed + counters.timedOut + counters.interrupted
const total = executed + counters.skipped
const passRate = executed === 0 ? 0 : (counters.passed / executed) * 100
const flakyRate = executed === 0 ? 0 : ((counters.failed + counters.timedOut + counters.interrupted) / executed) * 100

const summary = [
  '## E2E Gate KPI',
  '',
  `- Total: ${total}`,
  `- Executed: ${executed}`,
  `- Passed: ${counters.passed}`,
  `- Failed: ${counters.failed}`,
  `- Timed Out: ${counters.timedOut}`,
  `- Interrupted: ${counters.interrupted}`,
  `- Skipped: ${counters.skipped}`,
  `- Pass Rate (executed): ${passRate.toFixed(2)}%`,
  `- Flaky Proxy Rate: ${flakyRate.toFixed(2)}%`,
].join('\n')

console.log(summary)

if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`)
}
