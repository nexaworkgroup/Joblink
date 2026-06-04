import { FastifyInstance } from 'fastify'
import { authenticate, requireSeeker } from '../middleware/authenticate'
import { supabase } from '../lib/supabase'

export async function seekerRoutes(app: FastifyInstance) {

  // GET /seeker/stats
  app.get('/seeker/stats', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { count: total } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', id)
    const { count: submitted } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', id).in('status', ['submitted','acknowledged','interview','offered'])
    const { count: interviews } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('user_id', id).eq('status', 'interview')
    const { data: user } = await supabase.from('users').select('credits_balance').eq('id', id).single()
    return reply.send({ total: total||0, submitted: submitted||0, interviews: interviews||0, credits: user?.credits_balance||10 })
  })

  // GET /seeker/applications
  app.get('/seeker/applications', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { limit = '10', page = '1' } = request.query as any
    const lim = parseInt(limit)
    const offset = (parseInt(page) - 1) * lim

    const { data, count } = await supabase.from('applications')
      .select('*, jobs(id,title,company_name,company_logo_url,location,is_remote,africa_hiring_signal)', { count: 'exact' })
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + lim - 1)

    return reply.send({ applications: data||[], total: count||0 })
  })

  // PUT /seeker/applications/:id/status
  app.put('/seeker/applications/:appId/status', { preHandler: authenticate }, async (request, reply) => {
    const { appId } = request.params as { appId: string }
    const { id } = request.user!
    const { status, submitted_at } = request.body as any

    const VALID = ['generated','submitted','acknowledged','interview','offered','rejected','withdrawn']
    if (!VALID.includes(status)) return reply.status(400).send({ error: 'Invalid status' })

    const { data } = await supabase.from('applications')
      .update({ status, submitted_at: submitted_at || (status === 'submitted' ? new Date().toISOString() : undefined), updated_at: new Date().toISOString() })
      .eq('id', appId).eq('user_id', id).select().single()

    return reply.send({ application: data })
  })

  // GET /seeker/profile
  app.get('/seeker/profile', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data } = await supabase.from('profiles_seeker').select('*').eq('user_id', id).single()
    return reply.send({ profile: data })
  })

  // PUT /seeker/profile
  app.put('/seeker/profile', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const body = request.body as any
    const { data, error } = await supabase.from('profiles_seeker')
      .update({ ...body, updated_at: new Date().toISOString() }).eq('user_id', id).select().single()
    if (error) return reply.status(500).send({ error: error.message })
    return reply.send({ profile: data })
  })

  // GET /seeker/credits
  app.get('/seeker/credits', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data: user } = await supabase.from('users').select('credits_balance').eq('id', id).single()
    const { data: logs } = await supabase.from('credits_log').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(20)
    return reply.send({ balance: user?.credits_balance || 0, logs: logs || [] })
  })
}
