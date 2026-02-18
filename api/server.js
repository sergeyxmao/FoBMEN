import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import pg from 'pg'
import path from 'path'
import { fileURLToPath } from 'url'

import authRoutes from './routes/auth.js'
import productsRoutes from './routes/products.js'
import listingsRoutes from './routes/listings.js'
import offersRoutes from './routes/offers.js'
import dealsRoutes from './routes/deals.js'
import reviewsRoutes from './routes/reviews.js'
import adminRoutes from './routes/admin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = Fastify({ logger: true })

// PostgreSQL pool
const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
})

// Decorate fastify with db pool
app.decorate('db', pool)

// CORS
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
})

// Cookies
await app.register(cookie)

// Swagger
await app.register(swagger, {
  openapi: {
    info: {
      title: 'FOHOW Exchange API',
      description: 'API биржи обмена продукцией FOHOW',
      version: '1.0.0'
    },
    servers: [
      { url: 'https://exchange.marketingfohow.ru', description: 'Production' },
      { url: 'http://localhost:4002', description: 'Development' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
})

await app.register(swaggerUi, {
  routePrefix: '/api/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true
  }
})

// Health check
app.get('/api/health', {
  schema: {
    tags: ['System'],
    summary: 'Health check',
    description: 'Проверка состояния сервера и подключения к БД',
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          database: { type: 'string' },
          timestamp: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    await pool.query('SELECT 1')
    return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() }
  } catch (err) {
    return reply.code(503).send({ status: 'error', database: 'disconnected', timestamp: new Date().toISOString() })
  }
})

// Register routes
await app.register(authRoutes, { prefix: '/api/auth' })
await app.register(productsRoutes, { prefix: '/api/products' })
await app.register(listingsRoutes, { prefix: '/api/listings' })
await app.register(offersRoutes, { prefix: '/api/offers' })
await app.register(dealsRoutes, { prefix: '/api/deals' })
await app.register(reviewsRoutes, { prefix: '/api/reviews' })
await app.register(adminRoutes, { prefix: '/api/admin' })

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const fastifyStatic = await import('@fastify/static')
  await app.register(fastifyStatic.default, {
    root: path.join(__dirname, '..', 'dist'),
    prefix: '/'
  })

  app.setNotFoundHandler((request, reply) => {
    if (!request.url.startsWith('/api')) {
      reply.sendFile('index.html')
    } else {
      reply.code(404).send({ error: 'Not found' })
    }
  })
}

// Start server
const PORT = parseInt(process.env.PORT || '4002')
const HOST = process.env.HOST || '127.0.0.1'

try {
  await app.listen({ port: PORT, host: HOST })
  console.log(`FOHOW Exchange API running on http://${HOST}:${PORT}`)
  console.log(`Swagger UI: http://${HOST}:${PORT}/api/docs`)
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
