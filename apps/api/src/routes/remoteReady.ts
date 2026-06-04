import { FastifyInstance } from 'fastify'
export async function remoteReadyRoutes(app: FastifyInstance) {
  app.get('/remote-ready/ping', async () => ({ status: 'ok' }))
}
