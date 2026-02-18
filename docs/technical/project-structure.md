# FOHOW Exchange — Структура проекта

## Обзор

FOHOW Exchange (FoBMEN) — биржа обмена продукцией FOHOW. Третий проект экосистемы FOHOW (Board: 4000, FoChat: 4001, Exchange: 4002).

Все проекты используют общую базу данных PostgreSQL и общую таблицу `users`.

## Структура папок

```
FoBMEN/
├── api/                    # Backend (Fastify)
│   ├── server.js           # Точка входа
│   ├── package.json        # Зависимости backend
│   ├── routes/             # API-роуты
│   │   ├── auth.js         # Авторизация
│   │   ├── products.js     # Каталог продуктов
│   │   ├── listings.js     # Объявления
│   │   ├── offers.js       # Предложения обмена
│   │   ├── deals.js        # Сделки
│   │   ├── reviews.js      # Отзывы
│   │   └── admin.js        # Администрирование
│   ├── middleware/
│   │   └── auth.js         # JWT-аутентификация
│   └── migrations/
│       └── 001_exchange_tables.sql  # Справочная копия SQL
├── src/                    # Frontend (Vue 3)
│   ├── App.vue             # Корневой компонент
│   ├── main.js             # Точка входа
│   ├── router/index.js     # Vue Router
│   ├── stores/             # Pinia stores
│   ├── views/              # Страницы
│   ├── components/         # UI-компоненты
│   ├── composables/        # Composable-функции
│   └── assets/styles/      # CSS
├── public/                 # Статические файлы
├── docs/technical/         # Документация
├── index.html              # Точка входа Vite
├── vite.config.js          # Конфиг Vite
├── package.json            # Зависимости frontend
├── .env.example            # Шаблон .env
└── .gitignore
```

## Запуск для разработки

### Предварительные требования
- Node.js 18+
- PostgreSQL (доступ к общей БД)

### 1. Установка зависимостей

```bash
# Frontend
npm install

# Backend
cd api && npm install
```

### 2. Настройка окружения

```bash
cp .env.example .env
# Заполнить DB_PASSWORD и JWT_SECRET (скопировать из Board)
```

### 3. Запуск

```bash
# Терминал 1 — Frontend (Vite dev server, порт 5173)
npm run dev

# Терминал 2 — Backend (Fastify, порт 4002)
cd api && npm run dev
```

Frontend проксирует `/api/*` запросы на `localhost:4002`.

## Сборка для production

```bash
# Собрать frontend
npm run build

# Запуск backend (раздаёт статику из dist/)
cd api
NODE_ENV=production node server.js
```

В production-режиме Fastify отдаёт собранный frontend из `dist/` и обрабатывает SPA fallback.

## Переменные окружения

| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| PORT | Порт API | 4002 |
| HOST | Хост | 127.0.0.1 |
| NODE_ENV | Режим | development |
| DB_HOST | Хост PostgreSQL | — |
| DB_PORT | Порт БД | 5432 |
| DB_NAME | Имя БД | default_db |
| DB_USER | Пользователь БД | cloud_user |
| DB_PASSWORD | Пароль БД | — |
| JWT_SECRET | Секрет JWT (общий с Board) | — |
| CORS_ORIGIN | Допустимый origin | http://localhost:5173 |
| BOARD_API_URL | URL API Board | http://127.0.0.1:4000/api |
