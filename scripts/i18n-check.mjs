#!/usr/bin/env node
// i18n message parity check — fail CI when ko/en key trees diverge.
//
// Compares messages/ko.json against messages/en.json and reports:
//   - keys present in ko but missing in en
//   - keys present in en but missing in ko
//   - keys whose value is an empty string (untranslated placeholder)
//
// Mirrors @rules/i18n-strings.md ("ko/en 키 동기화 검증 (CI gate)").
//
// Usage:
//   node scripts/i18n-check.mjs

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const MESSAGES_DIR = join(ROOT, 'messages')
const LOCALES = ['ko', 'en']

/** Flatten a nested message object into dot-separated leaf keys. */
function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return value && typeof value === 'object' && !Array.isArray(value)
      ? flatten(value, path)
      : [[path, value]]
  })
}

function load(locale) {
  const file = join(MESSAGES_DIR, `${locale}.json`)
  return new Map(flatten(JSON.parse(readFileSync(file, 'utf8'))))
}

const [ko, en] = LOCALES.map(load)

const missingInEn = [...ko.keys()].filter((k) => !en.has(k))
const missingInKo = [...en.keys()].filter((k) => !ko.has(k))
const emptyValues = LOCALES.flatMap((locale) => {
  const map = locale === 'ko' ? ko : en
  return [...map.entries()]
    .filter(([, v]) => typeof v === 'string' && v.trim() === '')
    .map(([k]) => `${locale}: ${k}`)
})

const problems = []
if (missingInEn.length) problems.push(`missing in en (${missingInEn.length}):\n  ${missingInEn.join('\n  ')}`)
if (missingInKo.length) problems.push(`missing in ko (${missingInKo.length}):\n  ${missingInKo.join('\n  ')}`)
if (emptyValues.length) problems.push(`empty values (${emptyValues.length}):\n  ${emptyValues.join('\n  ')}`)

if (problems.length) {
  console.error('[i18n-check] FAIL — key trees diverge:\n')
  console.error(problems.join('\n\n'))
  process.exit(1)
}

console.log(`[i18n-check] OK — ${ko.size} keys, ko/en in sync`)
