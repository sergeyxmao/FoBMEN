import { authenticateToken } from '../middleware/auth.js'

export default async function offersRoutes(app) {
  // POST /api/offers
  app.post('/', {
    schema: {
      tags: ['Offers'],
      summary: 'Создать предложение обмена',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['listing_id'],
        properties: {
          listing_id: { type: 'integer' },
          message: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              required: ['product_id', 'quantity', 'condition'],
              properties: {
                product_id: { type: 'integer' },
                quantity: { type: 'integer', minimum: 1 },
                condition: { type: 'string', enum: ['new', 'opened', 'used'] }
              }
            }
          }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            listing_id: { type: 'integer' },
            from_user_id: { type: 'integer' },
            to_user_id: { type: 'integer' },
            message: { type: 'string', nullable: true },
            status: { type: 'string' },
            created_at: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    const { listing_id, message, items } = request.body
    const client = await app.db.connect()

    try {
      await client.query('BEGIN')

      // Get listing info
      const listing = await client.query(
        'SELECT user_id, status FROM exchange_listings WHERE id = $1',
        [listing_id]
      )
      if (listing.rows.length === 0) {
        await client.query('ROLLBACK')
        return reply.code(404).send({ error: 'Объявление не найдено' })
      }
      if (listing.rows[0].status !== 'active') {
        await client.query('ROLLBACK')
        return reply.code(400).send({ error: 'Объявление не активно' })
      }
      if (listing.rows[0].user_id === request.user.id) {
        await client.query('ROLLBACK')
        return reply.code(400).send({ error: 'Нельзя предложить обмен самому себе' })
      }

      // Create offer
      const offerResult = await client.query(
        `INSERT INTO exchange_offers (listing_id, from_user_id, to_user_id, message, status)
         VALUES ($1, $2, $3, $4, 'pending')
         RETURNING *`,
        [listing_id, request.user.id, listing.rows[0].user_id, message || null]
      )
      const offer = offerResult.rows[0]

      // Create offer items
      if (items && items.length > 0) {
        for (const item of items) {
          await client.query(
            `INSERT INTO exchange_offer_items (offer_id, product_id, quantity, condition)
             VALUES ($1, $2, $3, $4)`,
            [offer.id, item.product_id, item.quantity, item.condition]
          )
        }
      }

      await client.query('COMMIT')
      return reply.code(201).send(offer)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  })

  // GET /api/offers/incoming
  app.get('/incoming', {
    schema: {
      tags: ['Offers'],
      summary: 'Входящие предложения (мне)',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              listing_id: { type: 'integer' },
              from_user_id: { type: 'integer' },
              from_user_name: { type: 'string', nullable: true },
              message: { type: 'string', nullable: true },
              status: { type: 'string' },
              product_name: { type: 'string' },
              created_at: { type: 'string' }
            }
          }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    const result = await app.db.query(
      `SELECT o.*, u.full_name AS from_user_name, p.name AS product_name
       FROM exchange_offers o
       JOIN users u ON u.id = o.from_user_id
       JOIN exchange_listings l ON l.id = o.listing_id
       JOIN exchange_products p ON p.id = l.product_id
       WHERE o.to_user_id = $1
       ORDER BY o.created_at DESC`,
      [request.user.id]
    )
    return result.rows
  })

  // GET /api/offers/outgoing
  app.get('/outgoing', {
    schema: {
      tags: ['Offers'],
      summary: 'Исходящие предложения (от меня)',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              listing_id: { type: 'integer' },
              to_user_id: { type: 'integer' },
              to_user_name: { type: 'string', nullable: true },
              message: { type: 'string', nullable: true },
              status: { type: 'string' },
              product_name: { type: 'string' },
              created_at: { type: 'string' }
            }
          }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    const result = await app.db.query(
      `SELECT o.*, u.full_name AS to_user_name, p.name AS product_name
       FROM exchange_offers o
       JOIN users u ON u.id = o.to_user_id
       JOIN exchange_listings l ON l.id = o.listing_id
       JOIN exchange_products p ON p.id = l.product_id
       WHERE o.from_user_id = $1
       ORDER BY o.created_at DESC`,
      [request.user.id]
    )
    return result.rows
  })

  // PUT /api/offers/:id/accept
  app.put('/:id/accept', {
    schema: {
      tags: ['Offers'],
      summary: 'Принять предложение (создать сделку)',
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            offer: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                status: { type: 'string' }
              }
            },
            deal: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                status: { type: 'string' }
              }
            }
          }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    const { id } = request.params
    const client = await app.db.connect()

    try {
      await client.query('BEGIN')

      const offerResult = await client.query(
        'SELECT * FROM exchange_offers WHERE id = $1',
        [id]
      )
      if (offerResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return reply.code(404).send({ error: 'Предложение не найдено' })
      }

      const offer = offerResult.rows[0]
      if (offer.to_user_id !== request.user.id) {
        await client.query('ROLLBACK')
        return reply.code(403).send({ error: 'Нет прав на принятие этого предложения' })
      }
      if (offer.status !== 'pending') {
        await client.query('ROLLBACK')
        return reply.code(400).send({ error: 'Предложение уже обработано' })
      }

      // Accept offer
      await client.query(
        `UPDATE exchange_offers SET status = 'accepted', updated_at = NOW() WHERE id = $1`,
        [id]
      )

      // Reject other pending offers for this listing
      await client.query(
        `UPDATE exchange_offers SET status = 'rejected', updated_at = NOW()
         WHERE listing_id = $1 AND id != $2 AND status = 'pending'`,
        [offer.listing_id, id]
      )

      // Create deal
      const dealResult = await client.query(
        `INSERT INTO exchange_deals (offer_id, listing_id, seller_id, buyer_id, status)
         VALUES ($1, $2, $3, $4, 'in_progress')
         RETURNING *`,
        [id, offer.listing_id, offer.to_user_id, offer.from_user_id]
      )

      // Update listing status
      await client.query(
        `UPDATE exchange_listings SET status = 'paused', updated_at = NOW() WHERE id = $1`,
        [offer.listing_id]
      )

      await client.query('COMMIT')

      return {
        offer: { id, status: 'accepted' },
        deal: { id: dealResult.rows[0].id, status: 'in_progress' }
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  })

  // PUT /api/offers/:id/reject
  app.put('/:id/reject', {
    schema: {
      tags: ['Offers'],
      summary: 'Отклонить предложение',
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
    const offer = await app.db.query('SELECT * FROM exchange_offers WHERE id = $1', [id])

    if (offer.rows.length === 0) {
      return reply.code(404).send({ error: 'Предложение не найдено' })
    }
    if (offer.rows[0].to_user_id !== request.user.id) {
      return reply.code(403).send({ error: 'Нет прав' })
    }
    if (offer.rows[0].status !== 'pending') {
      return reply.code(400).send({ error: 'Предложение уже обработано' })
    }

    await app.db.query(
      `UPDATE exchange_offers SET status = 'rejected', updated_at = NOW() WHERE id = $1`,
      [id]
    )

    return { message: 'Предложение отклонено' }
  })

  // DELETE /api/offers/:id
  app.delete('/:id', {
    schema: {
      tags: ['Offers'],
      summary: 'Отменить своё предложение',
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
    const offer = await app.db.query('SELECT * FROM exchange_offers WHERE id = $1', [id])

    if (offer.rows.length === 0) {
      return reply.code(404).send({ error: 'Предложение не найдено' })
    }
    if (offer.rows[0].from_user_id !== request.user.id) {
      return reply.code(403).send({ error: 'Нет прав' })
    }
    if (offer.rows[0].status !== 'pending') {
      return reply.code(400).send({ error: 'Предложение уже обработано' })
    }

    await app.db.query(
      `UPDATE exchange_offers SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [id]
    )

    return { message: 'Предложение отменено' }
  })
}
