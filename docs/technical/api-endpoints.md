# FOHOW Exchange — API Endpoints

Базовый URL: `https://exchange.marketingfohow.ru/api`

Swagger UI: `/api/docs`

## Auth

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| POST | /api/auth/register | Регистрация | Нет |
| POST | /api/auth/login | Вход (возвращает JWT) | Нет |
| POST | /api/auth/logout | Выход | Да |
| GET | /api/auth/me | Текущий пользователь | Да |

### Пример: Вход

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "123456"
}
```

Ответ:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "Иван Иванов",
    "city": "Москва",
    "role": "user"
  }
}
```

## Products

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | /api/products | Список продуктов | Нет |
| GET | /api/products/:id | Детали продукта | Нет |

Query параметры GET /api/products:
- `category` — фильтр по категории (supplements, cosmetics, food, devices, other)
- `search` — поиск по названию

## Listings

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | /api/listings | Список объявлений | Нет |
| GET | /api/listings/:id | Детали (+ инкремент views) | Нет |
| POST | /api/listings | Создать объявление | Да |
| PUT | /api/listings/:id | Редактировать | Да |
| DELETE | /api/listings/:id | Отменить | Да |
| GET | /api/listings/my | Мои объявления | Да |

Query параметры GET /api/listings:
- `city` — фильтр по городу
- `category` — фильтр по категории продукта
- `product_id` — фильтр по ID продукта
- `status` — фильтр по статусу (по умолчанию active)
- `page` — страница (default 1)
- `limit` — кол-во на странице (default 20, max 50)

### Пример: Создание объявления

```
POST /api/listings
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": 1,
  "quantity": 2,
  "condition": "new",
  "city": "Москва",
  "description": "Не пригодились",
  "wanted_description": "Ищу косметику FOHOW"
}
```

## Offers

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| POST | /api/offers | Создать предложение | Да |
| GET | /api/offers/incoming | Входящие предложения | Да |
| GET | /api/offers/outgoing | Исходящие предложения | Да |
| PUT | /api/offers/:id/accept | Принять → создать deal | Да |
| PUT | /api/offers/:id/reject | Отклонить | Да |
| DELETE | /api/offers/:id | Отменить своё | Да |

### Пример: Создание предложения

```
POST /api/offers
Authorization: Bearer <token>
Content-Type: application/json

{
  "listing_id": 5,
  "message": "Готов обменять!",
  "items": [
    {
      "product_id": 3,
      "quantity": 1,
      "condition": "new"
    }
  ]
}
```

## Deals

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | /api/deals/my | Мои сделки | Да |
| GET | /api/deals/:id | Детали сделки | Да |
| PUT | /api/deals/:id/confirm | Подтвердить свою сторону | Да |
| PUT | /api/deals/:id/cancel | Отменить сделку | Да |

Логика подтверждения: когда обе стороны (`seller_confirmed` и `buyer_confirmed`) = true, сделка автоматически переходит в статус `completed`.

## Reviews

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| POST | /api/reviews | Оставить отзыв | Да |
| GET | /api/reviews/user/:userId | Отзывы о пользователе | Нет |

Отзыв можно оставить только по завершённой сделке (1 отзыв на сделку от каждого участника).

## Admin

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | /api/admin/stats | Статистика | Admin |
| POST | /api/admin/products | Добавить продукт | Admin |
| PUT | /api/admin/products/:id | Редактировать продукт | Admin |
| DELETE | /api/admin/products/:id | Деактивировать продукт | Admin |

## System

| Метод | Путь | Описание | Auth |
|-------|------|----------|------|
| GET | /api/health | Health check | Нет |

## Авторизация

Все защищённые эндпоинты требуют JWT-токен в заголовке:

```
Authorization: Bearer <token>
```

JWT payload: `{ id, email, role }`. Токен действителен 7 дней.
