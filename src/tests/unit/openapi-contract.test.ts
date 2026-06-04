/**
 * openapi-contract.test.ts — OpenAPI 문서 ↔ 실제 코드 계약(드리프트) 검증.
 *
 * 서버를 띄우지 않고 정적으로 다음을 강제한다:
 *  1. 모든 API 라우트 파일의 export된 HTTP 메서드가 openapi.ts 에 문서화돼 있다.
 *  2. openapi.ts 의 모든 path/method 가 실제 라우트 파일에 존재한다(orphan 문서 금지).
 *  3. zod 요청 스키마의 필드가 대응 OpenAPI 컴포넌트 스키마에 모두 존재한다.
 *
 * 라우트를 추가/삭제하거나 스키마 필드를 바꾸면 이 테스트가 깨져 문서 갱신을 강제한다.
 */
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

import { describe, it, expect } from 'vitest'

import {
  MemberCreateSchema,
  MemberUpdateSchema,
  MemberPatchSchema,
  AdminIdSchema,
  AdminRejectSchema,
  AdminMembersSchema,
  AdminAdminsSchema,
} from '@/lib/schemas'
import { openApiPaths, openApiDocument, type HttpMethod } from '@/lib/openapi'

const API_DIR = join(process.cwd(), 'src/app/api')
const HTTP_METHODS: HttpMethod[] = ['get', 'post', 'patch', 'put', 'delete']

/** 라우트 파일 경로 → OpenAPI path. `members/[id]/route.ts` → `/api/members/{id}` */
function toApiPath(relDir: string): string {
  const segs = relDir.split('/').filter(Boolean).map((s) => s.replace(/^\[(\.\.\.)?(.+)\]$/, '{$2}'))
  return '/api/' + segs.join('/')
}

/** API 디렉토리를 재귀 순회해 route.ts 파일의 {path, methods} 목록을 만든다. */
function collectRoutes(dir: string, rel = ''): Array<{ path: string; methods: HttpMethod[] }> {
  const out: Array<{ path: string; methods: HttpMethod[] }> = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const relPath = rel ? `${rel}/${entry}` : entry
    if (statSync(full).isDirectory()) {
      out.push(...collectRoutes(full, relPath))
    } else if (entry === 'route.ts') {
      // next-auth 내부 핸들러 + openapi 메타 엔드포인트는 문서 범위 밖
      if (rel.includes('[...nextauth]') || rel === 'openapi') continue
      const src = readFileSync(full, 'utf8')
      const methods = HTTP_METHODS.filter((m) => {
        const M = m.toUpperCase()
        return (
          new RegExp(`export\\s+(async\\s+)?function\\s+${M}\\b`).test(src) ||
          new RegExp(`export\\s+const\\s+${M}\\b`).test(src)
        )
      })
      if (methods.length) out.push({ path: toApiPath(rel), methods })
    }
  }
  return out
}

const routes = collectRoutes(API_DIR)

describe('OpenAPI 계약 — path/method 커버리지', () => {
  it('스캔된 라우트가 비어있지 않다', () => {
    expect(routes.length).toBeGreaterThan(10)
  })

  it('모든 라우트의 export된 메서드가 문서화돼 있다', () => {
    const missing: string[] = []
    for (const { path, methods } of routes) {
      const documented = openApiPaths[path]
      for (const m of methods) {
        if (!documented || !documented[m]) missing.push(`${m.toUpperCase()} ${path}`)
      }
    }
    expect(missing, `문서 누락: ${missing.join(', ')}`).toEqual([])
  })

  it('문서화된 모든 path/method 가 실제 라우트에 존재한다(orphan 금지)', () => {
    const routeMap = new Map(routes.map((r) => [r.path, new Set(r.methods)]))
    const orphans: string[] = []
    for (const [path, ops] of Object.entries(openApiPaths)) {
      for (const m of Object.keys(ops ?? {}) as HttpMethod[]) {
        if (!routeMap.get(path)?.has(m)) orphans.push(`${m.toUpperCase()} ${path}`)
      }
    }
    expect(orphans, `orphan 문서: ${orphans.join(', ')}`).toEqual([])
  })
})

describe('OpenAPI 계약 — zod 스키마 ↔ 컴포넌트 스키마 동기화', () => {
  const components = openApiDocument.components.schemas as Record<
    string,
    { properties?: Record<string, unknown> }
  >

  const cases: Array<{ zod: { shape: Record<string, unknown> }; component: string }> = [
    { zod: MemberCreateSchema, component: 'MemberCreate' },
    { zod: MemberUpdateSchema, component: 'MemberUpdate' },
    { zod: MemberPatchSchema, component: 'MemberPatch' },
    { zod: AdminIdSchema, component: 'AdminId' },
    { zod: AdminRejectSchema, component: 'AdminReject' },
    { zod: AdminMembersSchema, component: 'AdminMembers' },
    { zod: AdminAdminsSchema, component: 'AdminAdmins' },
  ]

  for (const { zod, component } of cases) {
    it(`${component}: zod 필드가 모두 문서화돼 있다`, () => {
      const zodKeys = Object.keys(zod.shape)
      const docKeys = Object.keys(components[component]?.properties ?? {})
      const missing = zodKeys.filter((k) => !docKeys.includes(k))
      expect(missing, `${component} 문서 누락 필드: ${missing.join(', ')}`).toEqual([])
    })

    it(`${component}: 문서에 zod에 없는 잉여 필드가 없다`, () => {
      const zodKeys = Object.keys(zod.shape)
      const docKeys = Object.keys(components[component]?.properties ?? {})
      const extra = docKeys.filter((k) => !zodKeys.includes(k))
      expect(extra, `${component} 잉여 문서 필드: ${extra.join(', ')}`).toEqual([])
    })
  }
})
