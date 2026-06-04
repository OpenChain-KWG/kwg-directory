/**
 * GET /api/openapi — 기계 판독용 OpenAPI 3.1 문서(JSON).
 *
 * 캐노니컬 원천: src/lib/openapi.ts. 외부 도구·`/docs/api` 페이지가 소비한다.
 * (메타 엔드포인트 — 계약 테스트 라우트 스캔에서 제외됨)
 */
import { NextResponse } from 'next/server'

import { openApiDocument } from '@/lib/openapi'

export async function GET() {
  return NextResponse.json(openApiDocument, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  })
}
