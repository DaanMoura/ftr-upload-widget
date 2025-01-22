import { fastify } from 'fastify'
import { fastifyCors } from '@fastify/cors'

const PORT = 3333
const HOST = '0.0.0.0'

const server = fastify()

server.register(fastifyCors, { origin: '*' })

server.listen({ port: PORT, host: HOST }).then(() => {
  console.log(`HTTP server running on port ${PORT}`)
})
