import { supabase } from '../../lib/supabase'
import { RawJob } from './normalizer'
import { getCameroonSeeds } from './seeds'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 30000 })

interface PipelineResult {
  fetched: number
  inserted: number
  skipped: number
  embedded: number
  duration: string
}

export async function runAggregationPipeline(): Promise<PipelineResult> {
  const start = Date.now()
  console.log('🚀 JobLink Aggregation Pipeline starting…')

  const allJobs: RawJob[] = []

  // Source 1: Seed jobs (always)
  const seeds = getCameroonSeeds()
  allJobs.push(...seeds)
  console.log(`  Seeds: ${seeds.length} jobs`)

  let fetched = allJobs.length
  let inserted = 0
  let skipped  = 0
  let embedded = 0

  // Dedup + insert
  for (const job of allJobs) {
    try {
      // Check if already exists
      const { data: existing } = await supabase.from('jobs')
        .select('id').eq('external_id', job.external_id).maybeSingle()

      if (existing) { skipped++; continue }

      // Insert job
      const { data: newJob, error } = await supabase.from('jobs').insert({
        external_id:          job.external_id,
        title:                job.title,
        company_name:         job.company_name,
        location:             job.location || 'Remote',
        is_remote:            job.is_remote,
        job_type:             job.job_type,
        experience_level:     job.experience_level,
        description:          job.description,
        requirements:         job.requirements,
        tags:                 job.tags,
        salary_min:           job.salary_min,
        salary_max:           job.salary_max,
        salary_currency:      job.salary_currency,
        external_url:         job.external_url,
        source:               job.source,
        source_name:          job.source_name,
        africa_hiring_signal: job.africa_hiring_signal,
        posted_at:            job.posted_at,
        is_active:            true,
      }).select('id').maybeSingle()

      if (error) { console.warn(`  Skip (error): ${job.title} — ${error.message}`); skipped++; continue }
      inserted++

      // Embed in background
      if (newJob && process.env.OPENAI_API_KEY) {
        embedJob(newJob.id, job).catch(() => {})
        embedded++
      }
    } catch (e: any) {
      console.warn(`  Skip (exception): ${job.title} — ${e.message}`)
      skipped++
    }
  }

  const duration = ((Date.now() - start) / 1000).toFixed(1) + 's'
  console.log(`✅ Pipeline complete: fetched=${fetched} inserted=${inserted} skipped=${skipped} (${duration})`)

  return { fetched, inserted, skipped, embedded, duration }
}

async function embedJob(jobId: string, job: RawJob) {
  try {
    const text = [job.title, job.company_name, job.description, job.requirements, job.tags.join(' ')].filter(Boolean).join(' ').slice(0, 8000)
    const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
    await supabase.from('jobs').update({ embedding: res.data[0].embedding as any }).eq('id', jobId)
  } catch {}
}

export async function expireOldJobs(): Promise<number> {
  const cutoff = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days
  // Count first, then update
  const { count } = await supabase.from('jobs')
    .select('*', { count: 'exact', head: true })
    .lt('posted_at', cutoff).eq('is_active', true).neq('source', 'native')
  if (count && count > 0) {
    await supabase.from('jobs').update({ is_active: false })
      .lt('posted_at', cutoff).eq('is_active', true).neq('source', 'native')
  }
  return count || 0
}
