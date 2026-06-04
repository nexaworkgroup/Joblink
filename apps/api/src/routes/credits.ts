import { FastifyInstance } from 'fastify'
import { authenticate } from '../middleware/authenticate.js'
import { supabase } from '../lib/supabase.js'

export async function creditsRoutes(app: FastifyInstance) {
  app.get('/credits/balance', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data } = await supabase.from('users').select('credits_balance').eq('id', id).single()
    return reply.send({ balance: data?.credits_balance ?? 0 })
  })

  app.get('/credits/log', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { data } = await supabase.from('credits_log').select('*, jobs(title, company_name)')
      .eq('user_id', id).order('created_at', { ascending: false }).limit(20)
    return reply.send({ log: data || [] })
  })

  // Initiate purchase (payment ready but inactive in V1)
  app.post('/credits/purchase', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.user!
    const { package: pkg, payment_method, phone } = request.body as any

    const PACKAGES: Record<string, { credits: number; amount: number }> = {
      starter:  { credits: 5,  amount: 1000 },
      standard: { credits: 15, amount: 2500 },
      pro:      { credits: 40, amount: 5500 },
    }

    if (!PACKAGES[pkg]) return reply.status(400).send({ error: 'Invalid package' })

    const { data: sub } = await supabase.from('subscriptions').insert({
      user_id: id, package: pkg,
      credits: PACKAGES[pkg].credits, amount: PACKAGES[pkg].amount,
      currency: 'XAF', payment_method, phone, status: 'pending'
    }).select().single()

    return reply.send({
      subscription_id: sub?.id,
      pending: true,
      message: 'V1: All credits are currently free. Payment activation coming soon.',
      coming_soon: true
    })
  })
}
