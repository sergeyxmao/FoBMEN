import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export function authenticateToken(request, reply, done) {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Требуется авторизация' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    request.user = decoded
    done()
  } catch (err) {
    reply.code(401).send({ error: 'Недействительный токен' })
  }
}

export function requireAdmin(request, reply, done) {
  if (!request.user || request.user.role !== 'admin') {
    reply.code(403).send({ error: 'Требуются права администратора' })
    return
  }
  done()
}
