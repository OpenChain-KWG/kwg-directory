/**
 * Audit log helper — append-only event recorder for admin actions.
 *
 * Uses the service-role client to bypass RLS and insert directly into
 * audit_logs. Failures are logged but never bubble up to the caller.
 */

import { createAdminClient } from '@/lib/supabase-admin'
import { logger } from '@/lib/logger'

export type AuditAction =
  | 'member.approve'
  | 'member.reject'
  | 'member.reinvite'
  | 'admin.add'
  | 'admin.remove'
  | 'admin.revoke'
  | 'me.export'
  | 'me.delete'

interface AuditLogParams {
  actorId: string | null | undefined
  action: AuditAction
  targetType: string
  targetId?: string | null
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  request?: Pick<Request, 'headers'>
}

/**
 * Record an admin action to audit_logs.
 * Never throws — failures are swallowed after logging.
 */
export async function auditLog(params: AuditLogParams): Promise<void> {
  const { actorId, action, targetType, targetId, before, after, request } = params

  const ip = request ? extractIp(request) : null
  const userAgent = request?.headers.get('user-agent') ?? null

  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from('audit_logs').insert({
      actor_id: actorId ?? null,
      action,
      target_type: targetType,
      target_id: targetId ?? null,
      before: before ?? null,
      after: after ?? null,
      ip: ip ?? null,
      user_agent: userAgent,
    })

    if (error) {
      logger.error({ err: error, action, target_type: targetType }, 'audit_log insert failed')
    }
  } catch (err) {
    logger.error(err instanceof Error ? err : new Error(String(err)), 'audit_log unexpected error')
  }
}

function extractIp(request: Pick<Request, 'headers'>): string | null {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() ?? null
  return request.headers.get('x-real-ip')
}
