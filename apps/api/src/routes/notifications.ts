import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate'
import { supabase } from '../lib/supabase'

export async function notificationRoutes(app: FastifyInstance) {

  app.get('/notifications', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data } = await supabase.from('notifications').select('*')
      .eq('user_id', id).order('created_at', { ascending: false }).limit(30)
    return reply.send({ notifications: data || [] })
  })

  app.get('/notifications/unread-count', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true })
      .eq('user_id', id).eq('is_read', false)
    return reply.send({ count: count || 0 })
  })

  app.put('/notifications/read-all', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', id)
    return reply.send({ success: true })
  })

  app.put('/notifications/:notifId/read', { preHandler: authenticate }, async (request, reply) => {
    const { notifId } = request.params as { notifId: string }
    const { id } = request.user!
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId).eq('user_id', id)
    return reply.send({ success: true })
  })
}
