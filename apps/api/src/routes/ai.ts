import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate'
import { supabase } from '../lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30000, maxRetries: 2 })

export async function aiRoutes(app: FastifyInstance) {

  // POST /ai/apply — core Bridge UX: generate tailored CV + cover letter
  app.post('/ai/apply', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { job_id } = request.body as { job_id: string }

    // Load job + seeker profile in parallel
    const [jobRes, profileRes, userRes] = await Promise.all([
      supabase.from('jobs').select('*').eq('id', job_id).single(),
      supabase.from('profiles_seeker').select('*').eq('user_id', id).single(),
      supabase.from('users').select('credits_balance').eq('id', id).single(),
    ])

    const job     = jobRes.data
    const profile = profileRes.data
    const user    = userRes.data

    if (!job)     return reply.status(404).send({ error: 'Job not found' })
    if (!profile) return reply.status(400).send({ error: 'Complete your profile before applying' })

    // In V1 all credits are free — just log the usage
    const creditsBalance = user?.credits_balance ?? 10

    // Check for existing cached package (within 24h)
    const { data: existing } = await supabase.from('applications')
      .select('cv_html, cover_letter, created_at')
      .eq('user_id', id).eq('job_id', job_id)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single()

    if (existing?.cv_html) {
      return reply.send({ cv_html: existing.cv_html, cover_letter: existing.cover_letter, cached: true })
    }

    // Build prompts
    const degreeEquivalent = getDegreeEquivalent(profile.degree || '')
    const skillsList = (profile.skills || []).slice(0, 15).join(', ')

    const cvPrompt = `Generate a professional, ATS-optimised CV in clean HTML for this exact job application.

JOB: ${job.title} at ${job.company_name}
JOB DESCRIPTION: ${(job.description || '').slice(0, 1500)}
REQUIREMENTS: ${(job.requirements || '').slice(0, 800)}

CANDIDATE PROFILE:
Name: ${profile.full_name}
Location: ${profile.location || 'Cameroon'}
Education: ${profile.degree || ''} ${degreeEquivalent} in ${profile.field_of_study || ''} — ${profile.institution || ''} (${profile.graduation_year || ''})
Skills: ${skillsList}
Bio: ${profile.bio || ''}
Languages: ${(profile.languages || ['English']).join(', ')}

INSTRUCTIONS:
- Tailor the CV specifically to THIS job — highlight matching skills
- Use semantic HTML only (h1, h2, p, ul, li, strong) — no CSS, no classes
- French degree names: add US equivalent in brackets e.g. "Licence (BSc equivalent)"
- Name as h1, contact info as p, then sections as h2: Summary, Education, Skills, Projects/Experience
- Be achievement-focused and professional
- Return ONLY the HTML body content, no DOCTYPE/html/head/body tags`

    const clPrompt = `Write a compelling cover letter for this job application.

JOB: ${job.title} at ${job.company_name}
DESCRIPTION: ${(job.description || '').slice(0, 1000)}

CANDIDATE:
Name: ${profile.full_name}
Skills: ${skillsList}
Background: ${profile.bio || ''}
Education: ${profile.degree || ''} in ${profile.field_of_study || ''} from ${profile.institution || ''}

INSTRUCTIONS:
- 3 short paragraphs maximum
- Opening: enthusiasm for the role + one specific thing about the company
- Middle: 2-3 concrete skills/achievements that match the job requirements
- Closing: strong call to action
- Professional but warm tone
- Do NOT use clichés like "I am writing to express my interest"
- Write in English regardless of candidate's language
- Return plain text only, no markdown`

    // Generate in parallel
    const [cvRes, clRes] = await Promise.allSettled([
      openai.chat.completions.create({
        model: 'gpt-4o-mini', max_tokens: 1500, temperature: 0.3,
        messages: [{ role: 'user', content: cvPrompt }]
      }),
      openai.chat.completions.create({
        model: 'gpt-4o-mini', max_tokens: 600, temperature: 0.5,
        messages: [{ role: 'user', content: clPrompt }]
      }),
    ])

    const cv_html    = cvRes.status === 'fulfilled'   ? (cvRes.value.choices[0]?.message?.content || '') : '<p>CV generation failed. Please try again.</p>'
    const cover_letter = clRes.status === 'fulfilled' ? (clRes.value.choices[0]?.message?.content || '') : 'Cover letter generation failed. Please try again.'

    // Save application record — native jobs go straight to submitted
    const appStatus = job.source === 'native' ? 'submitted' : 'generated'
    const { data: appData } = await supabase.from('applications').upsert({
      user_id: id, job_id, cv_html, cover_letter,
      status: appStatus, credit_used: true,
      submitted_at: job.source === 'native' ? new Date().toISOString() : null,
      job_snapshot: { title: job.title, company_name: job.company_name, external_url: job.external_url },
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,job_id' }).select().single()

    // Log credit usage (non-blocking, free in V1)
    Promise.resolve(
      supabase.from('credits_log').insert({ user_id: id, event_type: 'used', amount: -1, job_id, description: `AI application: ${job.title} at ${job.company_name}` })
    ).catch(() => {})

    return reply.send({ cv_html, cover_letter, application_id: appData?.id })
  })

  // POST /ai/improve-job
  app.post('/ai/improve-job', { preHandler: authenticate }, async (request, reply) => {
    const { title, description } = request.body as { title: string; description: string }
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', max_tokens: 600, temperature: 0.5,
        messages: [{ role: 'user', content: `Improve this job posting for "${title}" to attract African remote workers. Make it welcoming, clear, and inclusive. Keep it under 400 words.

Original:
${description}` }]
      })
      return reply.send({ improved: completion.choices[0]?.message?.content || description })
    } catch (e: any) {
      return reply.status(500).send({ error: 'Could not improve description' })
    }
  })

  // POST /ai/chat
  app.post('/ai/chat', { preHandler: authenticate }, async (request, reply) => {
    const { id, role } = request.user!
    const { message, history = [] } = request.body as any

    const system = role === 'employer'
      ? 'You are a hiring assistant for JobLink, a platform connecting African talent to global remote jobs. Help employers post effective jobs and find the best candidates. Be concise and practical.'
      : 'You are a career coach for JobLink, helping African professionals find global remote work. Give practical, encouraging advice on job applications, CVs, interview prep, and remote work. Be bilingual (EN/FR) if needed. Keep responses concise.'

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', max_tokens: 500, temperature: 0.7,
        messages: [
          { role: 'system', content: system },
          ...history.slice(-6),
          { role: 'user', content: message },
        ],
      })
      return reply.send({ reply: completion.choices[0]?.message?.content || 'Sorry, try again.' })
    } catch (e: any) {
      return reply.status(503).send({ error: 'AI service temporarily unavailable.' })
    }
  })
}

// Degree equivalency map
function getDegreeEquivalent(degree: string): string {
  const map: Record<string, string> = {
    'Licence': '(BSc equivalent)',
    'Licence Pro': '(BSc equivalent)',
    'BTS': '(Higher National Diploma equivalent)',
    'HND': '(Higher National Diploma)',
    'Maîtrise': '(MSc equivalent)',
    'Master': '(MSc)',
    'Doctorat': '(PhD equivalent)',
  }
  return map[degree] || ''
}
