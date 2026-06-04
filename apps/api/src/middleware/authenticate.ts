import { FastifyRequest, FastifyReply } from 'fastify'
import { supabase } from '../lib/supabase'

declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; email: string; role: string }
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const token = request.headers.authorization?.replace('Bearer ', '')
  if (!token) return reply.status(401).send({ error: 'Unauthorized' })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return reply.status(401).send({ error: 'Invalid token' })

  const { data: dbUser } = await supabase
    .from('users').select('role').eq('id', user.id).single()

  const role = dbUser?.role
    || user.user_metadata?.role
    || user.app_metadata?.role
    || 'job_seeker'

  request.user = { id: user.id, email: user.email || '', role }
}

// Returns a preHandler function directly (not async)
export function requireRole(role: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply)
    if (reply.sent) return
    if (request.user?.role !== role) {
      return reply.status(403).send({ error: 'Forbidden' })
    }
  }
}

export const requireSeeker   = requireRole('job_seeker')
export const requireEmployer = requireRole('employer')
