import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate'
import { supabase } from '../lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30000 })

export async function authRoutes(app: FastifyInstance) {

  // GET /auth/me
  app.get('/auth/me', { preHandler: authenticate }, async (request, reply) => {
    const { id, email, role } = request.user!

    // Upsert user — use merge so existing fields (onboarding_done) are preserved
    await supabase.from('users')
      .upsert({ id, email, role, updated_at: new Date().toISOString() }, { onConflict: 'id', ignoreDuplicates: false })

    // Fetch full user record separately so we get all fields including onboarding_done
    const { data: user } = await supabase.from('users').select('*').eq('id', id).maybeSingle()

    // Load profile — use maybeSingle so null profile doesn't throw
    let profile = null
    if (role === 'employer') {
      const { data } = await supabase.from('profiles_employer').select('*').eq('user_id', id).maybeSingle()
      profile = data
    } else {
      const { data } = await supabase.from('profiles_seeker').select('*').eq('user_id', id).maybeSingle()
      // Edge case: role mismatch — also try employer table
      if (!data) {
        const { data: emp } = await supabase.from('profiles_employer').select('*').eq('user_id', id).maybeSingle()
        profile = emp
      } else {
        profile = data
      }
    }

    return reply.send({
      user: user ?? { id, email, role, credits_balance: 10, lang_preference: 'en', plan: 'free', onboarding_done: false },
      profile
    })
  })

  // POST /auth/complete-onboarding
  app.post('/auth/complete-onboarding', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const body = request.body as any

    try {
      let profile = null

      if (body.role === 'employer') {
        // Check if profile exists using maybeSingle (no error if missing)
        const { data: existing } = await supabase.from('profiles_employer')
          .select('id').eq('user_id', id).maybeSingle()

        const profileData = {
          user_id: id,
          company_name: body.company_name,
          industry: body.industry,
          company_size: body.company_size,
          location: body.location,
          website: body.website,
          description: body.description
        }

        if (existing) {
          const { data, error } = await supabase.from('profiles_employer')
            .update(profileData).eq('user_id', id).select().maybeSingle()
          if (error) throw error
          profile = data
        } else {
          const { data, error } = await supabase.from('profiles_employer')
            .insert(profileData).select().maybeSingle()
          if (error) throw error
          profile = data
        }

      } else {
        // Job seeker — check if profile exists
        const { data: existing } = await supabase.from('profiles_seeker')
          .select('id').eq('user_id', id).maybeSingle()

        const profileData = {
          user_id: id,
          full_name: body.full_name,
          location: body.location,
          degree: body.degree,
          institution: body.institution,
          field_of_study: body.field_of_study,
          graduation_year: body.graduation_year ? parseInt(body.graduation_year) : null,
          bio: body.bio,
          skills: body.skills || [],
          languages: body.languages || ['English'],
          remote_setup_type: body.remote_setup_type,
          power_backup_type: body.power_backup_type,
        }

        if (existing) {
          const { data, error } = await supabase.from('profiles_seeker')
            .update(profileData).eq('user_id', id).select().maybeSingle()
          if (error) throw error
          profile = data
        } else {
          const { data, error } = await supabase.from('profiles_seeker')
            .insert(profileData).select().maybeSingle()
          if (error) throw error
          profile = data
        }

        // Generate embedding in background
        if (profile) generateEmbedding(id, body).catch(() => {})
      }

      // Mark onboarding done — upsert so it works even if users record doesn't exist yet
      await supabase.from('users').upsert(
        { id, onboarding_done: true, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )

      // Log signup credits (non-blocking, safe)
      Promise.resolve(
        supabase.from('credits_log').insert({
          user_id: id,
          event_type: 'signup_bonus',
          amount: 10,
          description: 'Welcome bonus — 10 free AI applications'
        })
      ).catch(() => {})

      return reply.send({ profile, success: true })

    } catch (err: any) {
      console.error('[Onboarding] Error:', err.message)
      return reply.status(500).send({ error: err.message || 'Failed to save profile' })
    }
  })

  // PUT /auth/language
  app.put('/auth/language', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { lang } = request.body as { lang: string }
    await supabase.from('users').update({ lang_preference: lang }).eq('id', id)
    return reply.send({ success: true })
  })
}

async function generateEmbedding(userId: string, profile: any) {
  try {
    const text = [
      profile.full_name, profile.bio,
      profile.degree, profile.field_of_study, profile.institution,
      (profile.skills || []).join(', '),
      profile.location
    ].filter(Boolean).join(' ').slice(0, 8000)

    const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
    await supabase.from('profiles_seeker')
      .update({ embedding: res.data[0].embedding as any })
      .eq('user_id', userId)
  } catch (e: any) {
    console.error('[Embedding] Failed:', e.message)
  }
}
