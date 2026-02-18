import { authenticateToken } from '../middleware/auth.js'

export default async function dealsRoutes(app) {
  // GET /api/deals/my
  app.get('/my', {
    schema: {
      tags: ['Deals'],
      summary: 'Мои сделки',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              listing_id: { type: 'integer' },
              offer_id: { type: 'integer' },
              seller_id: { type: 'integer' },
              buyer_id: { type: 'integer' },
              seller_name: { type: 'string', nullable: true },
              buyer_name: { type: 'string', nullable: true },
              product_name: { type: 'string' },
              status: { type: 'string' },
              seller_confirmed: { type: 'boolean' },
              buyer_confirmed: { type: 'boolean' },
              created_at: { type: 'string' },
              completed_at: { type: 'string', nullable: true }
            }
          }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    const result = await app.db.query(
      `SELECT d.*,
       s.full_name AS seller_name, b.full_name AS buyer_name,
       p.name AS product_name
       FROM exchange_deals d
       JOIN users s ON s.id = d.seller_id
       JOIN users b ON b.id = d.buyer_id
       JOIN exchange_listings l ON l.id = d.listing_id
       JOIN exchange_products p ON p.id = l.product_id
       WHERE d.seller_id = $1 OR d.buyer_id = $1
       ORDER BY d.created_at DESC`,
      [request.user.id]
    )
    return result.rows
  })

  // GET /api/deals/:id
  app.get('/:id', {
    schema: {
      tags: ['Deals'],
      summary: 'Детали сделки',
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
            id: { type: 'integer' },
            listing_id: { type: 'integer' },
            offer_id: { type: 'integer' },
            seller_id: { type: 'integer' },
            buyer_id: { type: 'integer' },
            seller_name: { type: 'string', nullable: true },
            buyer_name: { type: 'string', nullable: true },
            seller_city: { type: 'string', nullable: true },
            buyer_city: { type: 'string', nullable: true },
            product_name: { type: 'string' },
            product_category: { type: 'string' },
            listing_quantity: { type: 'integer' },
            listing_condition: { type: 'string' },
            status: { type: 'string' },
            seller_confirmed: { type: 'boolean' },
            buyer_confirmed: { type: 'boolean' },
            created_at: { type: 'string' },
            completed_at: { type: 'string', nullable: true }
          }
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    const { id } = request.params
    const result = await app.db.query(
      `SELECT d.*,
       s.full_name AS seller_name, s.city AS seller_city,
       b.full_name AS buyer_name, b.city AS buyer_city,
       p.name AS product_name, p.category AS product_category,
       l.quantity AS listing_quantity, l.condition AS listing_condition
       FROM exchange_deals d
       JOIN users s ON s.id = d.seller_id
       JOIN users b ON b.id = d.buyer_id
       JOIN exchange_listings l ON l.id = d.listing_id
       JOIN exchange_products p ON p.id = l.product_id
       WHERE d.id = $1`,
      [id]
    )

    if (result.rows.length === 0) {
      return reply.code(404).send({ error: 'Сделка не найдена' })
    }

    const deal = result.rows[0]
    if (deal.seller_id !== request.user.id && deal.buyer_id !== request.user.id) {
      return reply.code(403).send({ error: 'Нет доступа к этой сделке' })
    }

    return deal
  })

  // PUT /api/deals/:id/confirm
  app.put('/:id/confirm', {
    schema: {
      tags: ['Deals'],
      summary: 'Подтвердить свою сторону сделки',
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
            message: { type: 'string' },
            status: { type: 'string' },
            seller_confirmed: { type: 'boolean' },
            buyer_confirmed: { type: 'boolean' }
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

      const dealResult = await client.query('SELECT * FROM exchange_deals WHERE id = $1 FOR UPDATE', [id])
      if (dealResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return reply.code(404).send({ error: 'Сделка не найдена' })
      }

      const deal = dealResult.rows[0]
      if (deal.status !== 'in_progress') {
        await client.query('ROLLBACK')
        return reply.code(400).send({ error: 'Сделка уже завершена или отменена' })
      }

      const isSeller = deal.seller_id === request.user.id
      const isBuyer = deal.buyer_id === request.user.id

      if (!isSeller && !isBuyer) {
        await client.query('ROLLBACK')
        return reply.code(403).send({ error: 'Нет доступа к этой сделке' })
      }

      const field = isSeller ? 'seller_confirmed' : 'buyer_confirmed'
      await client.query(
        `UPDATE exchange_deals SET ${field} = true, updated_at = NOW() WHERE id = $1`,
        [id]
      )

      // Check if both confirmed
      const updated = await client.query('SELECT * FROM exchange_deals WHERE id = $1', [id])
      const updatedDeal = updated.rows[0]

      if (updatedDeal.seller_confirmed && updatedDeal.buyer_confirmed) {
        await client.query(
          `UPDATE exchange_deals SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
          [id]
        )
        await client.query(
          `UPDATE exchange_listings SET status = 'completed', updated_at = NOW() WHERE id = $1`,
          [deal.listing_id]
        )
        updatedDeal.status = 'completed'
      }

      await client.query('COMMIT')

      return {
        message: 'Подтверждение записано',
        status: updatedDeal.status,
        seller_confirmed: updatedDeal.seller_confirmed,
        buyer_confirmed: updatedDeal.buyer_confirmed
      }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  })

  // PUT /api/deals/:id/cancel
  app.put('/:id/cancel', {
    schema: {
      tags: ['Deals'],
      summary: 'Отменить сделку',
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
    const client = await app.db.connect()

    try {
      await client.query('BEGIN')

      const dealResult = await client.query('SELECT * FROM exchange_deals WHERE id = $1', [id])
      if (dealResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return reply.code(404).send({ error: 'Сделка не найдена' })
      }

      const deal = dealResult.rows[0]
      if (deal.seller_id !== request.user.id && deal.buyer_id !== request.user.id) {
        await client.query('ROLLBACK')
        return reply.code(403).send({ error: 'Нет доступа' })
      }
      if (deal.status !== 'in_progress') {
        await client.query('ROLLBACK')
        return reply.code(400).send({ error: 'Сделка уже завершена или отменена' })
      }

      await client.query(
        `UPDATE exchange_deals SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
        [id]
      )

      // Reactivate listing
      await client.query(
        `UPDATE exchange_listings SET status = 'active', updated_at = NOW() WHERE id = $1`,
        [deal.listing_id]
      )

      await client.query('COMMIT')
      return { message: 'Сделка отменена' }
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  })
}
