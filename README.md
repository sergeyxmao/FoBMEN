# FOHOW Exchange (FoBMEN)

Биржа обмена продукцией FOHOW. Третий проект экосистемы (Board: 4000, FoChat: 4001, Exchange: 4002).

## Стек

- **Frontend:** Vue 3 + Vite + Pinia + Vue Router
- **Backend:** Fastify 5 + PostgreSQL
- **Порт:** 4002
- **Домен:** exchange.marketingfohow.ru

## Быстрый старт

```bash
# Установить зависимости
npm install
cd api && npm install && cd ..

# Скопировать и заполнить .env
cp .env.example .env

# Запуск frontend (порт 5173)
npm run dev

# Запуск backend (порт 4002)
cd api && npm run dev
```

## Документация

- [Структура проекта](docs/technical/project-structure.md)
- [API Endpoints](docs/technical/api-endpoints.md)
- [Схема БД](docs/technical/database-schema.md)
- [Swagger API](docs/technical/swagger-api.md)
