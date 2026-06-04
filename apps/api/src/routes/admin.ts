import { FastifyInstance } from 'fastify'
import { supabase } from '../lib/supabase'

const SECRET = process.env.ADMIN_SECRET || 'joblink2026admin'

async function adminAuth(req: any, reply: any) {
  if (req.headers['x-admin-secret'] !== SECRET) return reply.status(403).send({ error: 'Forbidden' })
}

export async function adminRoutes(app: FastifyInstance) {

  app.get('/admin/stats', { preHandler: adminAuth }, async (_req, reply) => {
    const [
      { count: totalJobs }, { count: activeJobs },
      { count: seekers }, { count: employers },
      { count: applications }, { count: remoteReady },
      { count: pendingVideos }, { count: aiGenerations },
    ] = await Promise.all([
      supabase.from('jobs').select('*', { count: 'exact', head: true }),
      supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'job_seeker'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'employer'),
      supabase.from('applications').select('*', { count: 'exact', head: true }),
      supabase.from('remote_ready').select('*', { count: 'exact', head: true }).eq('badge_active', true),
      supabase.from('remote_ready').select('*', { count: 'exact', head: true }).eq('video_status', 'pending'),
      supabase.from('credits_log').select('*', { count: 'exact', head: true }).eq('event_type', 'used'),
    ])

    return reply.send({
      totalJobs: totalJobs || 0, activeJobs: activeJobs || 0,
      seekers: seekers || 0, employers: employers || 0,
      applications: applications || 0, remoteReady: remoteReady || 0,
      pendingVideos: pendingVideos || 0, aiGenerations: aiGenerations || 0,
    })
  })

  app.get('/admin/jobs', { preHandler: adminAuth }, async (req, reply) => {
    const { page = '1' } = req.query as any
    const limit = 50
    const { data: jobs, count } = await supabase.from('jobs')
      .select('id,title,company_name,source,africa_hiring_signal,is_active', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((parseInt(page) - 1) * limit, parseInt(page) * limit - 1)
    return reply.send({ jobs: jobs || [], total: count || 0 })
  })

  app.delete('/admin/jobs/:id', { preHandler: adminAuth }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await supabase.from('jobs').delete().eq('id', id)
    return reply.send({ success: true })
  })

  app.get('/admin/users', { preHandler: adminAuth }, async (_req, reply) => {
    const { data: users, count } = await supabase.from('users')
      .select('id,email,role,created_at', { count: 'exact' })
      .order('created_at', { ascending: false }).limit(100)

    const enriched = await Promise.all((users || []).map(async u => {
      if (u.role === 'employer') {
        const { data: emp } = await supabase.from('profiles_employer').select('company_name').eq('user_id', u.id).maybeSingle()
        return { ...u, name: emp?.company_name }
      } else {
        const { data: s } = await supabase.from('profiles_seeker').select('full_name').eq('user_id', u.id).maybeSingle()
        return { ...u, name: s?.full_name }
      }
    }))

    return reply.send({ users: enriched, total: count || 0 })
  })

  app.get('/admin/remote-ready-reviews', { preHandler: adminAuth }, async (_req, reply) => {
    const { data: pending } = await supabase.from('remote_ready')
      .select('user_id,power_video_url,speed_sessions,speed_passed,video_status,updated_at')
      .eq('video_status', 'pending')

    const enriched = await Promise.all((pending || []).map(async r => {
      const { data: profile } = await supabase.from('profiles_seeker')
        .select('full_name,location').eq('user_id', r.user_id).maybeSingle()
      const { data: user } = await supabase.from('users').select('email').eq('id', r.user_id).maybeSingle()
      return { ...r, full_name: profile?.full_name, location: profile?.location, email: user?.email }
    }))

    return reply.send({ pending: enriched })
  })

  app.post('/admin/remote-ready/:userId/review', { preHandler: adminAuth }, async (req, reply) => {
    const { userId } = req.params as { userId: string }
    const { approved } = req.body as { approved: boolean }

    if (approved) {
      const expiresAt = new Date(); expiresAt.setFullYear(expiresAt.getFullYear() + 1)
      await supabase.from('remote_ready').update({
        video_status: 'approved', badge_active: true,
        verified_at: new Date().toISOString(), expires_at: expiresAt.toISOString()
      }).eq('user_id', userId)

      Promise.resolve(supabase.from('notifications').insert({
        user_id: userId, type: 'badge', is_read: false,
        title: '🎉 Remote Ready Badge Approved!',
        message: 'Your badge is now active. It appears on all your AI-generated applications.'
      })).catch(() => {})
    } else {
      await supabase.from('remote_ready').update({
        video_status: 'rejected',
        video_reviewer_notes: 'Video did not clearly show backup power solution. Please resubmit.'
      }).eq('user_id', userId)
    }

    return reply.send({ success: true })
  })

  app.post('/admin/scrape', { preHandler: adminAuth }, async (_req, reply) => {
    // Trigger scraper — will be wired to pipeline in Sprint 5
    return reply.send({ success: true, inserted: 0, message: 'Scraper pipeline will be connected in Sprint 5' })
  })
}
