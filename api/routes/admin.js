import { authenticateToken, requireAdmin } from '../middleware/auth.js'

export default async function adminRoutes(app) {
  // GET /api/admin/stats
  app.get('/stats', {
    schema: {
      tags: ['Admin'],
      summary: 'Статистика платформы',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            users_count: { type: 'integer' },
            listings_count: { type: 'integer' },
            active_listings: { type: 'integer' },
            deals_count: { type: 'integer' },
            completed_deals: { type: 'integer' },
            products_count: { type: 'integer' }
          }
        }
      }
    },
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    const [users, listings, activeListings, deals, completedDeals, products] = await Promise.all([
      app.db.query('SELECT COUNT(*) FROM users'),
      app.db.query('SELECT COUNT(*) FROM exchange_listings'),
      app.db.query("SELECT COUNT(*) FROM exchange_listings WHERE status = 'active'"),
      app.db.query('SELECT COUNT(*) FROM exchange_deals'),
      app.db.query("SELECT COUNT(*) FROM exchange_deals WHERE status = 'completed'"),
      app.db.query('SELECT COUNT(*) FROM exchange_products WHERE is_active = true')
    ])

    return {
      users_count: parseInt(users.rows[0].count),
      listings_count: parseInt(listings.rows[0].count),
      active_listings: parseInt(activeListings.rows[0].count),
      deals_count: parseInt(deals.rows[0].count),
      completed_deals: parseInt(completedDeals.rows[0].count),
      products_count: parseInt(products.rows[0].count)
    }
  })

  // POST /api/admin/products
  app.post('/products', {
    schema: {
      tags: ['Admin'],
      summary: 'Добавить продукт в каталог',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'category'],
        properties: {
          name: { type: 'string' },
          name_en: { type: 'string' },
          category: { type: 'string', enum: ['supplements', 'cosmetics', 'food', 'devices', 'other'] },
          description: { type: 'string' },
          image_url: { type: 'string' },
          retail_price: { type: 'number' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            name_en: { type: 'string', nullable: true },
            category: { type: 'string' },
            description: { type: 'string', nullable: true },
            image_url: { type: 'string', nullable: true },
            retail_price: { type: 'number', nullable: true },
            is_active: { type: 'boolean' }
          }
        }
      }
    },
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    const { name, name_en, category, description, image_url, retail_price } = request.body

    const result = await app.db.query(
      `INSERT INTO exchange_products (name, name_en, category, description, image_url, retail_price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, name_en || null, category, description || null, image_url || null, retail_price || null]
    )

    return reply.code(201).send(result.rows[0])
  })

  // PUT /api/admin/products/:id
  app.put('/products/:id', {
    schema: {
      tags: ['Admin'],
      summary: 'Редактировать продукт',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          name_en: { type: 'string' },
          category: { type: 'string', enum: ['supplements', 'cosmetics', 'food', 'devices', 'other'] },
          description: { type: 'string' },
          image_url: { type: 'string' },
          retail_price: { type: 'number' },
          is_active: { type: 'boolean' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            name_en: { type: 'string', nullable: true },
            category: { type: 'string' },
            description: { type: 'string', nullable: true },
            image_url: { type: 'string', nullable: true },
            retail_price: { type: 'number', nullable: true },
            is_active: { type: 'boolean' }
          }
        }
      }
    },
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    const { id } = request.params
    const body = request.body
    const fields = []
    const values = []

    for (const key of ['name', 'name_en', 'category', 'description', 'image_url', 'retail_price', 'is_active']) {
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
      `UPDATE exchange_products SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    )

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Продукт не найден' })
    }

    return result.rows[0]
  })

  // DELETE /api/admin/products/:id
  app.delete('/products/:id', {
    schema: {
      tags: ['Admin'],
      summary: 'Деактивировать продукт',
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
    preHandler: [authenticateToken, requireAdmin]
  }, async (request, reply) => {
    const result = await app.db.query(
      'UPDATE exchange_products SET is_active = false WHERE id = $1 RETURNING id',
      [request.params.id]
    )

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Продукт не найден' })
    }

    return { message: 'Продукт деактивирован' }
  })
}
