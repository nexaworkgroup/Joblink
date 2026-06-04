import { FastifyInstance } from 'fastify'
export async function adminRoutes(app: FastifyInstance) {
  app.get('/admin/ping', async () => ({ route: 'admin', status: 'ok' }))
}
