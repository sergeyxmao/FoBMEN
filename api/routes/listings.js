import { authenticateToken } from '../middleware/auth.js'

export default async function listingsRoutes(app) {
  // GET /api/listings
  app.get('/', {
    schema: {
      tags: ['Listings'],
      summary: 'Список объявлений',
      querystring: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          category: { type: 'string' },
          product_id: { type: 'integer' },
          status: { type: 'string', enum: ['active', 'paused', 'completed', 'cancelled'] },
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  user_id: { type: 'integer' },
                  product_id: { type: 'integer' },
                  product_name: { type: 'string' },
                  product_category: { type: 'string' },
                  quantity: { type: 'integer' },
                  condition: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  city: { type: 'string', nullable: true },
                  wanted_description: { type: 'string', nullable: true },
                  status: { type: 'string' },
                  views_count: { type: 'integer' },
                  user_name: { type: 'string', nullable: true },
                  created_at: { type: 'string' }
                }
              }
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { city, category, product_id, status, page = 1, limit = 20 } = request.query
    const offset = (page - 1) * limit

    let where = 'WHERE 1=1'
    const params = []

    if (city) {
      params.push(city)
      where += ` AND l.city = $${params.length}`
    }

    if (category) {
      params.push(category)
      where += ` AND p.category = $${params.length}`
    }

    if (product_id) {
      params.push(product_id)
      where += ` AND l.product_id = $${params.length}`
    }

    if (status) {
      params.push(status)
      where += ` AND l.status = $${params.length}`
    } else {
      where += ` AND l.status = 'active'`
    }

    const countResult = await app.db.query(
      `SELECT COUNT(*) FROM exchange_listings l
       JOIN exchange_products p ON p.id = l.product_id
       ${where}`,
      params
    )
    const total = parseInt(countResult.rows[0].count)

    params.push(limit, offset)
    const result = await app.db.query(
      `SELECT l.*, p.name AS product_name, p.category AS product_category, u.full_name AS user_name
       FROM exchange_listings l
       JOIN exchange_products p ON p.id = l.product_id
       JOIN users u ON u.id = l.user_id
       ${where}
       ORDER BY l.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    return { items: result.rows, total, page, limit }
  })

  // GET /api/listings/my
  app.get('/my', {
    schema: {
      tags: ['Listings'],
      summary: 'Мои объявления',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              product_id: { type: 'integer' },
              product_name: { type: 'string' },
              quantity: { type: 'integer' },
              condition: { type: 'string' },
              description: { type: 'string', nullable: true },
              city: { type: 'string', nullable: true },
              wanted_description: { type: 'string', nullable: true },
              status: { type: 'string' },
              views_count: { type: 'integer' },
              offers_count: { type: 'integer' },
              created_at: { type: 'string' }
            }
          }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    const result = await app.db.query(
      `SELECT l.*, p.name AS product_name,
       (SELECT COUNT(*) FROM exchange_offers o WHERE o.listing_id = l.id AND o.status = 'pending') AS offers_count
       FROM exchange_listings l
       JOIN exchange_products p ON p.id = l.product_id
       WHERE l.user_id = $1
       ORDER BY l.created_at DESC`,
      [request.user.id]
    )
    return result.rows
  })

  // GET /api/listings/:id
  app.get('/:id', {
    schema: {
      tags: ['Listings'],
      summary: 'Детали объявления',
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            product_id: { type: 'integer' },
            product_name: { type: 'string' },
            product_category: { type: 'string' },
            quantity: { type: 'integer' },
            condition: { type: 'string' },
            description: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            wanted_description: { type: 'string', nullable: true },
            status: { type: 'string' },
            views_count: { type: 'integer' },
            user_name: { type: 'string', nullable: true },
            user_city: { type: 'string', nullable: true },
            created_at: { type: 'string' },
            updated_at: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => {
    const { id } = request.params

    // Increment views
    await app.db.query('UPDATE exchange_listings SET views_count = views_count + 1 WHERE id = $1', [id])

    const result = await app.db.query(
      `SELECT l.*, p.name AS product_name, p.category AS product_category,
       u.full_name AS user_name, u.city AS user_city
       FROM exchange_listings l
       JOIN exchange_products p ON p.id = l.product_id
       JOIN users u ON u.id = l.user_id
       WHERE l.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Объявление не найдено' })
    }

    return result.rows[0]
  })

  // POST /api/listings
  app.post('/', {
    schema: {
      tags: ['Listings'],
      summary: 'Создать объявление',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['product_id', 'quantity', 'condition'],
        properties: {
          product_id: { type: 'integer' },
          quantity: { type: 'integer', minimum: 1 },
          condition: { type: 'string', enum: ['new', 'opened', 'used'] },
          description: { type: 'string' },
          city: { type: 'string' },
          wanted_description: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            product_id: { type: 'integer' },
            quantity: { type: 'integer' },
            condition: { type: 'string' },
            description: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            wanted_description: { type: 'string', nullable: true },
            status: { type: 'string' },
            created_at: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    const { product_id, quantity, condition, description, city, wanted_description } = request.body

    const result = await app.db.query(
      `INSERT INTO exchange_listings (user_id, product_id, quantity, condition, description, city, wanted_description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING *`,
      [request.user.id, product_id, quantity, condition, description || null, city || null, wanted_description || null]
    )

    return reply.code(201).send(result.rows[0])
  })

  // PUT /api/listings/:id
  app.put('/:id', {
    schema: {
      tags: ['Listings'],
      summary: 'Редактировать своё объявление',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          quantity: { type: 'integer', minimum: 1 },
          condition: { type: 'string', enum: ['new', 'opened', 'used'] },
          description: { type: 'string' },
          city: { type: 'string' },
          wanted_description: { type: 'string' },
          status: { type: 'string', enum: ['active', 'paused', 'cancelled'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            product_id: { type: 'integer' },
            quantity: { type: 'integer' },
            condition: { type: 'string' },
            description: { type: 'string', nullable: true },
            city: { type: 'string', nullable: true },
            wanted_description: { type: 'string', nullable: true },
            status: { type: 'string' },
            updated_at: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    const { id } = request.params

    // Check ownership
    const check = await app.db.query('SELECT user_id FROM exchange_listings WHERE id = $1', [id])
    if (check.rows.length === 0) {
      return reply.code(404).send({ error: 'Объявление не найдено' })
    }
    if (check.rows[0].user_id !== request.user.id) {
      return reply.code(403).send({ error: 'Нет прав на редактирование' })
    }

    const fields = []
    const values = []
    const body = request.body

    for (const key of ['quantity', 'condition', 'description', 'city', 'wanted_description', 'status']) {
      if (body[key] !== undefined) {
        values.push(body[key])
        fields.push(`${key} = $${values.length}`)
      }
    }

    if (fields.length === 0) {
      return reply.code(400).send({ error: 'Нет полей для обновления' })
    }

    values.push(id)
    const result = await app.db.query(
      `UPDATE exchange_listings SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    )

    return result.rows[0]
  })

  // DELETE /api/listings/:id
  app.delete('/:id', {
    schema: {
      tags: ['Listings'],
      summary: 'Удалить/отменить своё объявление',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: { message: { type: 'string' } }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    const { id } = request.params

    const check = await app.db.query('SELECT user_id FROM exchange_listings WHERE id = $1', [id])
    if (check.rows.length === 0) {
      return reply.code(404).send({ error: 'Объявление не найдено' })
    }
    if (check.rows[0].user_id !== request.user.id) {
      return reply.code(403).send({ error: 'Нет прав на удаление' })
    }

    await app.db.query(`UPDATE exchange_listings SET status = 'cancelled', updated_at = NOW() WHERE id = $1`, [id])
    return { message: 'Объявление отменено' }
  })
}
