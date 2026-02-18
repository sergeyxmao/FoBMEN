export default async function productsRoutes(app) {
  // GET /api/products
  app.get('/', {
    schema: {
      tags: ['Products'],
      summary: 'Список продуктов (каталог)',
      querystring: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['supplements', 'cosmetics', 'food', 'devices', 'other'] },
          search: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'array',
          items: {
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
      }
    }
  }, async (request, reply) => {
    const { category, search } = request.query
    let query = 'SELECT * FROM exchange_products WHERE is_active = true'
    const params = []

    if (category) {
      params.push(category)
      query += ` AND category = $${params.length}`
    }

    if (search) {
      params.push(`%${search}%`)
      query += ` AND (name ILIKE $${params.length} OR name_en ILIKE $${params.length})`
    }

    query += ' ORDER BY name'

    const result = await app.db.query(query, params)
    return result.rows
  })

  // GET /api/products/:id
  app.get('/:id', {
    schema: {
      tags: ['Products'],
      summary: 'Детали продукта',
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        },
        required: ['id']
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
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } }
        }
      }
    }
  }, async (request, reply) => {
    const result = await app.db.query('SELECT * FROM exchange_products WHERE id = $1', [request.params.id])
    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Продукт не найден' })
    }
    return result.rows[0]
  })
}
