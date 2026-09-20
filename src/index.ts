import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import paymentsRoutes from './routes/payments.js'

const app = new Hono()

app.route('/api/v1/payments', paymentsRoutes)

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: 4000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
