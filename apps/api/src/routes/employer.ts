import { FastifyInstance } from 'fastify'
import { authenticate, requireEmployer } from '../middleware/authenticate'
import { supabase } from '../lib/supabase'

export async function employerRoutes(app: FastifyInstance) {

  // GET /employer/stats
  app.get('/employer/stats', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data: emp } = await supabase.from('profiles_employer').select('id').eq('user_id', id).maybeSingle()
    if (!emp) return reply.send({ activeJobs: 0, totalApplications: 0, interviews: 0, offers: 0 })

    const { data: jobs } = await supabase.from('jobs').select('id, is_active').eq('employer_id', emp.id)
    const jobIds = (jobs || []).map(j => j.id)
    const activeJobs = (jobs || []).filter(j => j.is_active).length

    let totalApplications = 0, interviews = 0, offers = 0
    if (jobIds.length > 0) {
      const { count: total } = await supabase.from('applications').select('*', { count: 'exact', head: true }).in('job_id', jobIds)
      const { count: iv } = await supabase.from('applications').select('*', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'interview')
      const { count: of } = await supabase.from('applications').select('*', { count: 'exact', head: true }).in('job_id', jobIds).eq('status', 'offered')
      totalApplications = total || 0; interviews = iv || 0; offers = of || 0
    }

    return reply.send({ activeJobs, totalApplications, interviews, offers })
  })

  // GET /employer/jobs
  app.get('/employer/jobs', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data: emp } = await supabase.from('profiles_employer').select('id').eq('user_id', id).maybeSingle()
    if (!emp) return reply.send({ jobs: [] })

    const { data: jobs } = await supabase.from('jobs')
      .select('id, title, description, job_type, experience_level, location, is_remote, salary_min, salary_max, salary_currency, africa_hiring_signal, is_active, posted_at, tags, external_url')
      .eq('employer_id', emp.id)
      .order('created_at', { ascending: false })

    // Add application counts
    const jobsWithCounts = await Promise.all((jobs || []).map(async (job) => {
      const { count } = await supabase.from('applications').select('*', { count: 'exact', head: true }).eq('job_id', job.id)
      return { ...job, application_count: count || 0 }
    }))

    return reply.send({ jobs: jobsWithCounts })
  })

  // POST /employer/jobs
  app.post('/employer/jobs', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const body = request.body as any

    // Get or create employer profile
    let { data: emp } = await supabase.from('profiles_employer').select('id, company_name').eq('user_id', id).maybeSingle()
    if (!emp) return reply.status(400).send({ error: 'Complete your company profile first' })

    const { data: job, error } = await supabase.from('jobs').insert({
      employer_id: emp.id,
      title: body.title,
      company_name: emp.company_name || body.company_name || 'Company',
      description: body.description,
      requirements: body.requirements || null,
      location: body.location || 'Remote',
      is_remote: body.is_remote !== false,
      job_type: body.job_type || 'full_time',
      experience_level: body.experience_level || 'any',
      salary_min: body.salary_min || null,
      salary_max: body.salary_max || null,
      salary_currency: body.salary_currency || 'USD',
      tags: body.tags || [],
      external_url: body.external_url || null,
      africa_hiring_signal: body.africa_hiring_signal || 5,
      source: 'native',
      is_active: true,
      posted_at: new Date().toISOString(),
    }).select().maybeSingle()

    if (error) return reply.status(500).send({ error: error.message })
    return reply.status(201).send({ job })
  })

  // GET /employer/applications
  app.get('/employer/applications', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { job_id } = request.query as { job_id?: string }

    const { data: emp } = await supabase.from('profiles_employer').select('id').eq('user_id', id).maybeSingle()
    if (!emp) return reply.send({ applications: [] })

    const { data: jobs } = await supabase.from('jobs').select('id').eq('employer_id', emp.id)
    const jobIds = job_id ? [job_id] : (jobs || []).map(j => j.id)
    if (jobIds.length === 0) return reply.send({ applications: [] })

    const { data: apps } = await supabase.from('applications')
      .select('id, status, created_at, user_id, job_id, jobs(title, company_name)')
      .in('job_id', jobIds)
      .order('created_at', { ascending: false })

    // Enrich with seeker profiles
    const enriched = await Promise.all((apps || []).map(async (app) => {
      const { data: seeker } = await supabase.from('profiles_seeker')
        .select('full_name, location, degree, field_of_study, institution, skills, linkedin_url, github_url, portfolio_url')
        .eq('user_id', app.user_id).maybeSingle()

      const { data: rr } = await supabase.from('remote_ready')
        .select('badge_active').eq('user_id', app.user_id).maybeSingle()

      return { ...app, seeker: { ...seeker, remote_ready_active: rr?.badge_active || false } }
    }))

    return reply.send({ applications: enriched })
  })

  // PUT /employer/applications/:id/status
  app.put('/employer/applications/:id/status', { preHandler: authenticate }, async (request, reply) => {
    const { id: appId } = request.params as { id: string }
    const { status } = request.body as { status: string }

    const VALID = ['generated','submitted','acknowledged','interview','offered','rejected']
    if (!VALID.includes(status)) return reply.status(400).send({ error: 'Invalid status' })

    const { data, error } = await supabase.from('applications').update({ status, updated_at: new Date().toISOString() }).eq('id', appId).select().maybeSingle()
    if (error) return reply.status(500).send({ error: error.message })

    // Notify seeker
    if (data) {
      const messages: Record<string, string> = {
        submitted:    '👀 Your application has been reviewed',
        interview:    '🎯 You\'ve been invited for an interview!',
        offered:      '🎉 Congratulations! You have a job offer!',
        rejected:     'Thank you for applying — the position has been filled',
      }
      if (messages[status]) {
        Promise.resolve(supabase.from('notifications').insert({
          user_id: data.user_id,
          type: 'application',
          title: messages[status],
          message: `Update on your application`,
          is_read: false,
        })).catch(() => {})
      }
    }

    return reply.send({ application: data })
  })
}
