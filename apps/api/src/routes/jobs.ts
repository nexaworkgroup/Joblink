import { FastifyInstance } from 'fastify'
export async function jobsRoutes(app: FastifyInstance) {
  app.get('/jobs/ping', async () => ({ route: 'jobs', status: 'ok' }))
}
