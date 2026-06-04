#!/usr/bin/env node
/**
 * gen-openapi.mjs — src/lib/openapi.ts 의 openApiDocument 를 docs/api/openapi.yaml 로 생성.
 *
 * 사용: node scripts/gen-openapi.mjs [--check]
 *   (no flag) docs/api/openapi.yaml 갱신
 *   --check   현재 파일이 최신인지 검증(CI). 불일치 시 non-zero 종료.
 *
 * 캐노니컬 원천은 TS 객체다. YAML 은 발행 아티팩트(Swagger UI·외부 도구용).
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

import { createJiti } from 'jiti'
import yaml from 'js-yaml'

const root = join(import.meta.dirname, '..')
const OUT = join(root, 'docs/api/openapi.yaml')

// TS 모듈을 런타임 트랜스파일로 로드(별도 빌드 불필요)
const jiti = createJiti(import.meta.url)
const { openApiDocument } = await jiti.import(join(root, 'src/lib/openapi.ts'))

const header = '# 이 파일은 자동 생성됩니다. 직접 수정 금지.\n# 원천: src/lib/openapi.ts — `node scripts/gen-openapi.mjs` 로 재생성.\n'
const body = header + yaml.dump(openApiDocument, { lineWidth: 120, noRefs: true, sortKeys: false })

const isCheck = process.argv.includes('--check')
if (isCheck) {
  if (!existsSync(OUT)) {
    console.error(`✗ ${OUT} 없음 — \`node scripts/gen-openapi.mjs\` 실행 필요`)
    process.exit(1)
  }
  const current = readFileSync(OUT, 'utf8')
  if (current !== body) {
    console.error('✗ docs/api/openapi.yaml 가 src/lib/openapi.ts 와 불일치 — 재생성 필요')
    process.exit(1)
  }
  console.log('✓ openapi.yaml 최신')
} else {
  mkdirSync(join(root, 'docs/api'), { recursive: true })
  writeFileSync(OUT, body)
  console.log(`✓ ${OUT} 생성 (${Object.keys(openApiDocument.paths).length} paths)`)
}
