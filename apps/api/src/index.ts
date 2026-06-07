import Fastify from 'fastify'
import cors from '@fastify/cors'
import { startScheduler } from './services/scheduler'
import { authRoutes } from './routes/auth'
import { jobsRoutes } from './routes/jobs'
import { seekerRoutes } from './routes/seeker'
import { employerRoutes } from './routes/employer'
import { aiRoutes } from './routes/ai'
import { remoteReadyRoutes } from './routes/remoteReady'
import { adminRoutes } from './routes/admin'
import { notificationRoutes } from './routes/notifications'

async function main() {
  const app = Fastify({ logger: { level: 'warn' } })

  await app.register(cors, {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5174',
      'http://localhost:5174',
    ],
    credentials: true,
  })

  app.get('/health', async () => ({
    status: 'ok', service: 'JobLink API', version: '1.0.0'
  }))

  await app.register(authRoutes)
  await app.register(jobsRoutes)
  await app.register(seekerRoutes)
  await app.register(employerRoutes)
  await app.register(aiRoutes)
  await app.register(remoteReadyRoutes)
  await app.register(adminRoutes)
  await app.register(notificationRoutes)

  const PORT = parseInt(process.env.PORT || '3002')
  await app.listen({ port: PORT, host: '0.0.0.0' })

  console.log(`\n🔗 JobLink API running on http://localhost:${PORT}`)
  console.log(`📋 Health: http://localhost:${PORT}/health\n`)

  startScheduler()
}

main().catch(err => {
  console.error('❌ API failed to start:', err)
  process.exit(1)
})
