import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { authenticateToken } from '../middleware/auth.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export default async function authRoutes(app) {
  // POST /api/auth/register
  app.post('/register', {
    schema: {
      tags: ['Auth'],
      summary: 'Регистрация нового пользователя',
      body: {
        type: 'object',
        required: ['email', 'password', 'full_name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          full_name: { type: 'string', minLength: 1 },
          city: { type: 'string' },
          phone: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                email: { type: 'string' },
                full_name: { type: 'string' },
                city: { type: 'string', nullable: true },
                role: { type: 'string' }
              }
            }
          }
        },
        409: {
          type: 'object',
          properties: { error: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password, full_name, city, phone } = request.body

    // Check if user exists
    const existing = await app.db.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return reply.code(409).send({ error: 'Пользователь с таким email уже существует' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const result = await app.db.query(
      `INSERT INTO users (email, password, full_name, city, phone, role)
       VALUES ($1, $2, $3, $4, $5, 'user')
       RETURNING id, email, full_name, city, role`,
      [email, passwordHash, full_name, city || null, phone || null]
    )

    const user = result.rows[0]
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

    return reply.code(201).send({ token, user })
  })

  // POST /api/auth/login
  app.post('/login', {
    schema: {
      tags: ['Auth'],
      summary: 'Вход в систему',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                email: { type: 'string' },
                full_name: { type: 'string', nullable: true },
                city: { type: 'string', nullable: true },
                role: { type: 'string' },
                avatar_url: { type: 'string', nullable: true }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body

    const result = await app.db.query(
      'SELECT id, email, password, full_name, city, role, avatar_url FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return reply.code(401).send({ error: 'Неверный email или пароль' })
    }

    const user = result.rows[0]
    const validPassword = await bcrypt.compare(password, user.password)

    if (!validPassword) {
      return reply.code(401).send({ error: 'Неверный email или пароль' })
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

    const { password: _, ...userWithoutPassword } = user
    return { token, user: userWithoutPassword }
  })

  // POST /api/auth/logout
  app.post('/logout', {
    schema: {
      tags: ['Auth'],
      summary: 'Выход из системы',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: { message: { type: 'string' } }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    return { message: 'Выход выполнен' }
  })

  // GET /api/auth/me
  app.get('/me', {
    schema: {
      tags: ['Auth'],
      summary: 'Текущий пользователь',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            full_name: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            role: { type: 'string' },
            avatar_url: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            telegram_user: { type: 'string', nullable: true }
          }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    const result = await app.db.query(
      'SELECT id, email, full_name, city, role, avatar_url, phone, telegram_user FROM users WHERE id = $1',
      [request.user.id]
    )

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Пользователь не найден' })
    }

    return result.rows[0]
  })
}
