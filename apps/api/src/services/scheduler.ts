import { runAggregationPipeline, expireOldJobs } from './scraper/pipeline'

let isRunning = false

export function startScheduler() {
  console.log('📅 JobLink scheduler started')

  // Run initial seed on startup (only inserts if not already in DB)
  setTimeout(async () => {
    if (isRunning) return
    isRunning = true
    try {
      await runAggregationPipeline()
    } finally {
      isRunning = false
    }
  }, 3000)

  // Every 6 hours
  setInterval(async () => {
    if (isRunning) return
    isRunning = true
    try { await runAggregationPipeline() } catch (e) { console.error('[Scheduler] Pipeline error:', e) }
    finally { isRunning = false }
  }, 6 * 60 * 60 * 1000)

  // Daily at 3am — expire old jobs
  setInterval(async () => {
    try {
      const n = await expireOldJobs()
      if (n > 0) console.log(`[Scheduler] Expired ${n} old jobs`)
    } catch (e) { console.error('[Scheduler] Expiry error:', e) }
  }, 24 * 60 * 60 * 1000)
}
