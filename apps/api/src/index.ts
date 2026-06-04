import Fastify from 'fastify'
import cors from '@fastify/cors'
import { startScheduler } from './services/scheduler.js'
import { authRoutes } from './routes/auth.js'
import { jobsRoutes } from './routes/jobs.js'
import { seekerRoutes } from './routes/seeker.js'
import { employerRoutes } from './routes/employer.js'
import { aiRoutes } from './routes/ai.js'
import { remoteReadyRoutes } from './routes/remoteReady.js'
import { adminRoutes } from './routes/admin.js'

const app = Fastify({ logger: { level: 'warn' } })

await app.register(cors, {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5174',
    'http://localhost:5174',
  ],
  credentials: true,
})

app.get('/health', async () => ({ status: 'ok', service: 'JobLink API', version: '1.0.0' }))

await app.register(authRoutes)
await app.register(jobsRoutes)
await app.register(seekerRoutes)
await app.register(employerRoutes)
await app.register(aiRoutes)
await app.register(remoteReadyRoutes)
await app.register(adminRoutes)

const PORT = parseInt(process.env.PORT || '3002')

app.listen({ port: PORT, host: '0.0.0.0' }, (err) => {
  if (err) { console.error(err); process.exit(1) }
  console.log(`\n🔗 JobLink API running on http://localhost:${PORT}`)
  console.log(`📋 Health: http://localhost:${PORT}/health\n`)
})

startScheduler()
