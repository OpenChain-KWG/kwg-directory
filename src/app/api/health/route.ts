import { NextResponse } from 'next/server'
import pkg from '../../../../package.json'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const startedAt = Date.now()

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      version: pkg.version,
    },
    { status: 200 },
  )
}
