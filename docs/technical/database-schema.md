# FOHOW Exchange — Схема базы данных

Все таблицы Exchange имеют префикс `exchange_`. Таблица `users` — общая для всей экосистемы FOHOW.

## Таблицы

### users (общая таблица)

Используемые поля:
| Поле | Тип | Описание |
|------|-----|----------|
| id | integer (PK) | ID пользователя |
| email | text NOT NULL | Email |
| password | text NOT NULL | bcrypt hash пароля |
| full_name | text | Полное имя |
| city | text | Город |
| avatar_url | varchar | URL аватарки |
| role | varchar (default 'user') | Роль (user/admin) |
| phone | varchar | Телефон |
| telegram_user | text | Telegram username |

### exchange_products (справочник продукции)

| Поле | Тип | Описание |
|------|-----|----------|
| id | serial (PK) | ID продукта |
| name | varchar(255) NOT NULL | Название (RU) |
| name_en | varchar(255) | Название (EN) |
| category | varchar(50) NOT NULL | Категория |
| description | text | Описание |
| image_url | text | URL изображения |
| retail_price | numeric(10,2) | Розничная цена |
| is_active | boolean (default true) | Активен |
| created_at | timestamptz | Дата создания |

**Категории:** supplements, cosmetics, food, devices, other

### exchange_listings (объявления)

| Поле | Тип | Описание |
|------|-----|----------|
| id | serial (PK) | ID объявления |
| user_id | integer (FK → users.id) | Автор |
| product_id | integer (FK → exchange_products.id) | Продукт |
| quantity | integer NOT NULL (default 1) | Количество |
| condition | varchar(20) NOT NULL | Состояние товара |
| description | text | Описание |
| city | varchar(100) | Город |
| wanted_description | text | Что хочу взамен |
| status | varchar(20) (default 'active') | Статус |
| views_count | integer (default 0) | Просмотры |
| created_at | timestamptz | Дата создания |
| updated_at | timestamptz | Дата обновления |

**Состояния товара (condition):** new, opened, used

**Статусы:** active, paused, completed, cancelled

### exchange_offers (предложения обмена)

| Поле | Тип | Описание |
|------|-----|----------|
| id | serial (PK) | ID предложения |
| listing_id | integer (FK → exchange_listings.id) | Объявление |
| from_user_id | integer (FK → users.id) | Кто предлагает |
| to_user_id | integer (FK → users.id) | Кому предлагает |
| message | text | Сообщение |
| status | varchar(20) (default 'pending') | Статус |
| created_at | timestamptz | Дата создания |
| updated_at | timestamptz | Дата обновления |

**Статусы:** pending, accepted, rejected, cancelled, expired

### exchange_offer_items (позиции предложения)

| Поле | Тип | Описание |
|------|-----|----------|
| id | serial (PK) | ID |
| offer_id | integer (FK → exchange_offers.id) | Предложение |
| product_id | integer (FK → exchange_products.id) | Продукт |
| quantity | integer NOT NULL (default 1) | Количество |
| condition | varchar(20) NOT NULL | Состояние |

### exchange_deals (сделки)

| Поле | Тип | Описание |
|------|-----|----------|
| id | serial (PK) | ID сделки |
| offer_id | integer (FK → exchange_offers.id) | Предложение |
| listing_id | integer (FK → exchange_listings.id) | Объявление |
| seller_id | integer (FK → users.id) | Продавец |
| buyer_id | integer (FK → users.id) | Покупатель |
| status | varchar(20) (default 'in_progress') | Статус |
| seller_confirmed | boolean (default false) | Продавец подтвердил |
| buyer_confirmed | boolean (default false) | Покупатель подтвердил |
| created_at | timestamptz | Дата создания |
| updated_at | timestamptz | Дата обновления |
| completed_at | timestamptz | Дата завершения |

**Статусы:** in_progress, completed, disputed, cancelled

### exchange_reviews (отзывы)

| Поле | Тип | Описание |
|------|-----|----------|
| id | serial (PK) | ID отзыва |
| deal_id | integer (FK → exchange_deals.id) | Сделка |
| from_user_id | integer (FK → users.id) | Кто оставил |
| to_user_id | integer (FK → users.id) | Кому оставлен |
| rating | integer NOT NULL (1-5) | Оценка |
| comment | text | Комментарий |
| created_at | timestamptz | Дата создания |

**Ограничение:** UNIQUE (deal_id, from_user_id) — один отзыв от каждого участника на сделку.

## Связи (Foreign Keys)

```
exchange_listings.user_id        → users.id
exchange_listings.product_id     → exchange_products.id
exchange_offers.listing_id       → exchange_listings.id
exchange_offers.from_user_id     → users.id
exchange_offers.to_user_id       → users.id
exchange_offer_items.offer_id    → exchange_offers.id
exchange_offer_items.product_id  → exchange_products.id
exchange_deals.offer_id          → exchange_offers.id
exchange_deals.listing_id        → exchange_listings.id
exchange_deals.seller_id         → users.id
exchange_deals.buyer_id          → users.id
exchange_reviews.deal_id         → exchange_deals.id
exchange_reviews.from_user_id    → users.id
exchange_reviews.to_user_id      → users.id
```
