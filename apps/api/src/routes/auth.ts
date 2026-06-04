import { FastifyInstance } from 'fastify'
export async function authRoutes(app: FastifyInstance) {
  app.get('/auth/ping', async () => ({ route: 'auth', status: 'ok' }))
}
