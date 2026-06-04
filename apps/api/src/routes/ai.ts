import { FastifyInstance } from 'fastify'
export async function aiRoutes(app: FastifyInstance) {
  app.get('/ai/ping', async () => ({ route: 'ai', status: 'ok' }))
}
