#!/usr/bin/env node
// Design token lint — fail CI only on NEW hex/arbitrary violations.
//
// Existing violations are recorded in .lint-tokens-baseline.json (created at
// Phase 1). Phase 4 will migrate components and shrink the baseline.
// New violations introduced after baseline creation cause CI failure.
//
// Build-time design-token enforcement (CI gate): no hardcoded hex or
// arbitrary design values outside the token system.
//
// Usage:
//   node scripts/lint-tokens.mjs                  # check vs baseline
//   node scripts/lint-tokens.mjs --update-baseline # rewrite baseline (use after migration)
//   node scripts/lint-tokens.mjs --strict          # ignore baseline, fail on any violation

import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const SRC_DIR = join(ROOT, 'src')
const BASELINE_FILE = join(ROOT, '.lint-tokens-baseline.json')

const args = new Set(process.argv.slice(2))
const updateBaseline = args.has('--update-baseline')
const strict = args.has('--strict')

const EXEMPT_PATTERNS = [
  'src/design-system/tokens/',
  'src/app/globals.css',
  'node_modules/',
  '/tests/',
  '/__tests__/',
  '/e2e/',
  '.stories.',
]

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g
const ARBITRARY_RE = /\[(\d+(?:\.\d+)?)(px|rem|em)\]/g

const violations = []

function shouldScan(filePath) {
  if (!/\.(tsx?|css)$/.test(filePath)) return false
  return !EXEMPT_PATTERNS.some((p) => filePath.includes(p))
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    let stat
    try {
      stat = statSync(full)
    } catch {
      continue
    }
    if (stat.isDirectory()) {
      walk(full)
    } else if (shouldScan(full)) {
      scan(full)
    }
  }
}

function scan(filePath) {
  const content = readFileSync(filePath, 'utf8')
  if (content.includes('design-token-exempt:')) return

  const lines = content.split('\n')
  lines.forEach((line, idx) => {
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) return

    const hexMatches = line.match(HEX_RE)
    if (hexMatches) {
      for (const hex of hexMatches) {
        if (line.includes('--color-') && line.trim().startsWith('--')) continue
        violations.push(violationKey(filePath, idx + 1, 'hex', hex))
      }
    }

    const arbMatches = [...line.matchAll(ARBITRARY_RE)]
    for (const m of arbMatches) {
      violations.push(violationKey(filePath, idx + 1, 'arbitrary', m[0]))
    }
  })
}

function violationKey(filePath, line, kind, value) {
  return { file: relative(ROOT, filePath), line, kind, value }
}

function vid(v) {
  return `${v.file}:${v.line}:${v.kind}:${v.value}`
}

walk(SRC_DIR)

if (updateBaseline) {
  const sorted = [...violations].sort((a, b) =>
    a.file === b.file ? a.line - b.line : a.file.localeCompare(b.file),
  )
  writeFileSync(
    BASELINE_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        note:
          'Existing design-token violations recorded at Phase 1. Phase 4 component refactor should shrink this. Regenerate after migration: npm run lint:tokens -- --update-baseline',
        count: sorted.length,
        violations: sorted,
      },
      null,
      2,
    ) + '\n',
  )
  console.log(`[lint-tokens] baseline updated — ${sorted.length} violations`)
  process.exit(0)
}

const baseline = !strict && existsSync(BASELINE_FILE)
  ? new Set((JSON.parse(readFileSync(BASELINE_FILE, 'utf8')).violations ?? []).map(vid))
  : new Set()

const news = strict ? violations : violations.filter((v) => !baseline.has(vid(v)))

if (news.length === 0) {
  console.log(
    `[lint-tokens] OK — 0 new violations${
      strict ? '' : ` (${violations.length - news.length} grandfathered via baseline)`
    }`,
  )
  process.exit(0)
}

console.error(`[lint-tokens] ${news.length} NEW violations:`)
for (const v of news.slice(0, 50)) {
  console.error(`  ${v.file}:${v.line}  ${v.kind} → ${v.value}`)
}
if (news.length > 50) {
  console.error(`  ... and ${news.length - 50} more`)
}
console.error('Fix: use design tokens from src/design-system/tokens/ or Tailwind theme keys.')
console.error('Exempt: add `// design-token-exempt: <reason>` comment in the same file.')
console.error('Phase-4 migration: regenerate baseline with `npm run lint:tokens -- --update-baseline`')
process.exit(1)
