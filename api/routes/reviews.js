import { authenticateToken } from '../middleware/auth.js'

export default async function reviewsRoutes(app) {
  // POST /api/reviews
  app.post('/', {
    schema: {
      tags: ['Reviews'],
      summary: 'Оставить отзыв (только для completed deal)',
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['deal_id', 'rating'],
        properties: {
          deal_id: { type: 'integer' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            deal_id: { type: 'integer' },
            from_user_id: { type: 'integer' },
            to_user_id: { type: 'integer' },
            rating: { type: 'integer' },
            comment: { type: 'string', nullable: true },
            created_at: { type: 'string' }
          }
        }
      }
    },
    preHandler: authenticateToken
  }, async (request, reply) => {
    const { deal_id, rating, comment } = request.body

    // Check deal exists and is completed
    const deal = await app.db.query('SELECT * FROM exchange_deals WHERE id = $1', [deal_id])
    if (deal.rows.length === 0) {
      return reply.code(404).send({ error: 'Сделка не найдена' })
    }
    if (deal.rows[0].status !== 'completed') {
      return reply.code(400).send({ error: 'Отзыв можно оставить только для завершённой сделки' })
    }

    const d = deal.rows[0]
    const isSeller = d.seller_id === request.user.id
    const isBuyer = d.buyer_id === request.user.id

    if (!isSeller && !isBuyer) {
      return reply.code(403).send({ error: 'Вы не участник этой сделки' })
    }

    const toUserId = isSeller ? d.buyer_id : d.seller_id

    // Check duplicate review
    const existing = await app.db.query(
      'SELECT id FROM exchange_reviews WHERE deal_id = $1 AND from_user_id = $2',
      [deal_id, request.user.id]
    )
    if (existing.rows.length > 0) {
      return reply.code(409).send({ error: 'Вы уже оставили отзыв по этой сделке' })
    }

    const result = await app.db.query(
      `INSERT INTO exchange_reviews (deal_id, from_user_id, to_user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [deal_id, request.user.id, toUserId, rating, comment || null]
    )

    return reply.code(201).send(result.rows[0])
  })

  // GET /api/reviews/user/:userId
  app.get('/user/:userId', {
    schema: {
      tags: ['Reviews'],
      summary: 'Отзывы о пользователе',
      params: {
        type: 'object',
        properties: { userId: { type: 'integer' } },
        required: ['userId']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            reviews: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  rating: { type: 'integer' },
                  comment: { type: 'string', nullable: true },
                  from_user_name: { type: 'string', nullable: true },
                  created_at: { type: 'string' }
                }
              }
            },
            average_rating: { type: 'number', nullable: true },
            total_reviews: { type: 'integer' }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { userId } = request.params

    const result = await app.db.query(
      `SELECT r.*, u.full_name AS from_user_name
       FROM exchange_reviews r
       JOIN users u ON u.id = r.from_user_id
       WHERE r.to_user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    )

    const avgResult = await app.db.query(
      'SELECT AVG(rating)::numeric(3,2) AS avg, COUNT(*) AS count FROM exchange_reviews WHERE to_user_id = $1',
      [userId]
    )

    return {
      reviews: result.rows,
      average_rating: avgResult.rows[0].avg ? parseFloat(avgResult.rows[0].avg) : null,
      total_reviews: parseInt(avgResult.rows[0].count)
    }
  })
}
