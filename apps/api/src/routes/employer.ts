import { FastifyInstance } from 'fastify'
export async function employerRoutes(app: FastifyInstance) {
  app.get('/employer/ping', async () => ({ route: 'employer', status: 'ok' }))
}
