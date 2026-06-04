import { FastifyInstance } from 'fastify'
import { supabase } from '../lib/supabase'

export async function jobsRoutes(app: FastifyInstance) {

  // GET /jobs — paginated, filtered feed
  app.get('/jobs', async (request, reply) => {
    const { q, type, min_signal = '2', page = '1' } = request.query as any
    const pageNum = parseInt(page) || 1
    const limit   = 20
    const offset  = (pageNum - 1) * limit
    const minSig  = parseInt(min_signal) || 2

    let query = supabase.from('jobs')
      .select('id,title,company_name,location,is_remote,job_type,experience_level,tags,salary_min,salary_max,salary_currency,external_url,source,africa_hiring_signal,posted_at', { count: 'exact' })
      .eq('is_active', true)
      .gte('africa_hiring_signal', minSig)

    if (q)    query = query.or(`title.ilike.%${q}%,company_name.ilike.%${q}%,description.ilike.%${q}%`)
    if (type) query = query.eq('job_type', type)

    query = query.order('africa_hiring_signal', { ascending: false })
                 .order('posted_at', { ascending: false })
                 .range(offset, offset + limit - 1)

    const { data: jobs, count, error } = await query
    if (error) return reply.status(500).send({ error: error.message })

    return reply.send({ jobs: jobs || [], total: count || 0, page: pageNum })
  })

  // GET /jobs/stats
  app.get('/jobs/stats', async (_req, reply) => {
    const [{ count: jobs }, { count: employers }] = await Promise.all([
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles_employer').select('*', { count: 'exact', head: true }),
    ])
    return reply.send({ jobs: jobs || 0, employers: employers || 0 })
  })

  // GET /jobs/:id
  app.get('/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { data: job, error } = await supabase.from('jobs').select('*').eq('id', id).single()
    if (error || !job) return reply.status(404).send({ error: 'Job not found' })
    return reply.send({ job })
  })

  // GET /seeker/feed — AI-matched feed (with pgvector)
  app.get('/seeker/feed', async (request: any, reply) => {
    const userId = request.user?.id
    const { page = '1' } = request.query as any
    const pageNum = parseInt(page) || 1
    const limit   = 20
    const offset  = (pageNum - 1) * limit

    if (userId) {
      const { data: profile } = await supabase.from('profiles_seeker')
        .select('embedding').eq('user_id', userId).single()

      if (profile?.embedding) {
        const { data: jobs } = await supabase.rpc('match_jobs', {
          query_embedding: profile.embedding,
          min_signal: 2,
          match_count: limit,
          match_offset: offset,
        })
        if (jobs) return reply.send({ jobs, has_embedding: true })
      }
    }

    // Fallback — no embedding yet
    const { data: jobs } = await supabase.from('jobs')
      .select('id,title,company_name,location,is_remote,job_type,tags,salary_min,salary_max,salary_currency,external_url,africa_hiring_signal,posted_at')
      .eq('is_active', true).order('africa_hiring_signal', { ascending: false })
      .order('posted_at', { ascending: false }).range(offset, offset + limit - 1)

    return reply.send({ jobs: jobs || [], has_embedding: false })
  })
}
