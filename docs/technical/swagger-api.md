# FOHOW Exchange — Swagger UI

## Доступ

- **Development:** http://localhost:4002/api/docs
- **Production:** https://exchange.marketingfohow.ru/api/docs

## Авторизация в Swagger

1. Откройте Swagger UI
2. Нажмите кнопку **Authorize** (замок в правом верхнем углу)
3. В поле Value введите JWT-токен (без префикса `Bearer`)
4. Нажмите **Authorize**
5. Теперь все защищённые эндпоинты будут отправлять токен автоматически

Для получения токена используйте эндпоинт **POST /api/auth/login**.

## Теги

| Тег | Описание |
|-----|----------|
| Auth | Регистрация, вход, выход, текущий пользователь |
| Products | Каталог продукции FOHOW |
| Listings | Объявления об обмене |
| Offers | Предложения обмена |
| Deals | Сделки |
| Reviews | Отзывы |
| Admin | Администрирование (только для admin) |
| System | Системные эндпоинты (health check) |

## Конфигурация

Swagger генерируется автоматически из JSON Schema, которые указаны в каждом роуте Fastify. Все схемы описывают:
- `tags` — группировка
- `summary` — краткое описание
- `security` — требуется ли авторизация
- `body` / `params` / `querystring` — входные данные
- `response` — формат ответа

## OpenAPI спецификация

JSON: `GET /api/docs/json`
