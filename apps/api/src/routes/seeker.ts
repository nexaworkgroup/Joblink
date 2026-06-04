import { FastifyInstance } from 'fastify'
export async function seekerRoutes(app: FastifyInstance) {
  app.get('/seeker/ping', async () => ({ route: 'seeker', status: 'ok' }))
}
