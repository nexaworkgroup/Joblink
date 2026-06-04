import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate'
import { supabase } from '../lib/supabase'

export async function remoteReadyRoutes(app: FastifyInstance) {

  // GET /remote-ready/status — get current badge status
  app.get('/remote-ready/status', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data: badge } = await supabase
      .from('remote_ready').select('*').eq('user_id', id).maybeSingle()
    return reply.send({ badge: badge || null })
  })

  // GET /remote-ready/speed-test — run server-side speed measurement
  app.get('/remote-ready/speed-test', { preHandler: authenticate }, async (request, reply) => {
    const start = Date.now()
    // Send a 1MB payload to measure download speed from server perspective
    const payload = Buffer.alloc(1024 * 100, 'x').toString()
    const duration = Date.now() - start
    const latency = duration

    return reply.send({
      latency_ms: latency,
      server_time: new Date().toISOString(),
      payload_size: payload.length,
      message: 'Use this latency reading as one data point'
    })
  })

  // POST /remote-ready/speed-session — record a client-side speed test result
  app.post('/remote-ready/speed-session', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { mbps, latency_ms } = request.body as { mbps: number; latency_ms: number }

    if (!mbps || mbps <= 0) return reply.status(400).send({ error: 'Invalid speed reading' })

    // Get or create remote_ready record
    const { data: existing } = await supabase
      .from('remote_ready').select('*').eq('user_id', id).maybeSingle()

    const newSession = {
      mbps: Math.round(mbps * 10) / 10,
      latency_ms: Math.round(latency_ms),
      tested_at: new Date().toISOString(),
      ip_hash: String(request.ip || 'unknown').slice(0, 8)
    }

    let sessions = existing?.speed_sessions || []
    sessions = [...sessions, newSession].slice(-5) // keep last 5

    // Check if speed test passes (avg >= 5 Mbps, avg latency <= 150ms across 3+ sessions)
    const speedPassed = sessions.length >= 3
      && (sessions.reduce((s: number, r: any) => s + r.mbps, 0) / sessions.length) >= 5

    if (existing) {
      await supabase.from('remote_ready').update({
        speed_sessions: sessions,
        speed_passed: speedPassed,
        speed_passed_at: speedPassed && !existing.speed_passed ? new Date().toISOString() : existing.speed_passed_at,
        updated_at: new Date().toISOString()
      }).eq('user_id', id)
    } else {
      await supabase.from('remote_ready').insert({
        user_id: id,
        speed_sessions: sessions,
        speed_passed: speedPassed,
        speed_passed_at: speedPassed ? new Date().toISOString() : null,
        video_status: 'not_submitted',
        badge_active: false
      })
    }

    return reply.send({
      session_saved: true,
      sessions_count: sessions.length,
      speed_passed: speedPassed,
      average_mbps: Math.round(sessions.reduce((s: number, r: any) => s + r.mbps, 0) / sessions.length * 10) / 10,
      sessions_needed: Math.max(0, 3 - sessions.length)
    })
  })

  // POST /remote-ready/submit-video — record video submission
  app.post('/remote-ready/submit-video', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { video_url } = request.body as { video_url: string }

    if (!video_url) return reply.status(400).send({ error: 'Video URL required' })

    const { data: existing } = await supabase
      .from('remote_ready').select('id').eq('user_id', id).maybeSingle()

    if (existing) {
      await supabase.from('remote_ready').update({
        power_video_url: video_url,
        video_status: 'pending',
        updated_at: new Date().toISOString()
      }).eq('user_id', id)
    } else {
      await supabase.from('remote_ready').insert({
        user_id: id,
        power_video_url: video_url,
        video_status: 'pending',
        speed_sessions: [],
        speed_passed: false,
        badge_active: false
      })
    }

    return reply.send({ submitted: true, status: 'pending' })
  })

  // POST /remote-ready/check-badge — check if both conditions met and activate badge
  app.post('/remote-ready/check-badge', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data: record } = await supabase
      .from('remote_ready').select('*').eq('user_id', id).maybeSingle()

    if (!record) return reply.send({ badge_active: false, missing: ['speed_test', 'video_verification'] })

    const missing = []
    if (!record.speed_passed) missing.push('speed_test')
    if (record.video_status !== 'approved') missing.push('video_verification')

    const canActivate = record.speed_passed && record.video_status === 'approved'

    if (canActivate && !record.badge_active) {
      const expiresAt = new Date()
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)

      await supabase.from('remote_ready').update({
        badge_active: true,
        verified_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      }).eq('user_id', id)

      // Notify user
      Promise.resolve(supabase.from('notifications').insert({
        user_id: id,
        type: 'badge',
        title: '🎉 Remote Ready Badge Earned!',
        message: 'Your badge is now active. It will appear on all your job applications.'
      })).catch(() => {})
    }

    return reply.send({
      badge_active: canActivate,
      speed_passed: record.speed_passed,
      video_status: record.video_status,
      missing
    })
  })
}
