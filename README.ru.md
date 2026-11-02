[English](README.md) | Русский

# USP Shop

Интернет-магазин обуви и одежды для физического магазина в Семее, Казахстан. Каталог, корзина, оформление заказов, личный кабинет и админ-панель для управления товарами и заказами.

## Стек

**Бэкенд** — Go, [gorilla/mux](https://github.com/gorilla/mux), MongoDB, JWT, bcrypt, logrus.
**Фронтенд** — Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion.
**Внешние сервисы** — MongoDB Atlas (база), Cloudinary (фото товаров), Resend (письма), Telegram Bot API (уведомления о заказах).

## Структура проекта

```
cmd/server/        точка входа бэкенда
config/             загрузка конфига, подключение к MongoDB
internal/
  models/           структуры данных
  repository/       слой работы с MongoDB
  services/         бизнес-логика
  handlers/         HTTP-хендлеры
pkg/
  email/            отправка писем через Resend
  telegram/         уведомления о заказах
  jwt/               генерация и проверка токенов
  middleware/       авторизация, rate limiting, CORS, логирование
  upload/            загрузка изображений в Cloudinary
  logger/            логирование
frontend/           Next.js приложение
```

## Запуск локально

### Бэкенд

Нужен файл `.env` в корне проекта со следующими переменными:

```
MONGO_URI=mongodb+srv://...
DB_NAME=uspshop
JWT_SECRET=любая-случайная-строка
PORT=8080
APP_URL=http://localhost:3000

RESEND_API_KEY=
SMTP_USER=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

ORDER_RETENTION_DAYS=30
ALLOWED_ORIGINS=http://localhost:3000
```

`JWT_SECRET` обязателен — сервер откажется стартовать без него (или если он равен `secret`). `MONGO_URI` должен указывать на реплика-сет (MongoDB Atlas подходит на любом тарифе) — используются транзакции при оформлении заказа.

```bash
go run cmd/server/main.go
```

### Фронтенд

```bash
cd frontend
npm install
npm run dev
```

Адрес бэкенда для фронтенда задаётся в `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Тесты

```bash
go test ./...
```

Юнит-тесты покрывают критичную бизнес-логику: проверку остатков, расчёт корзины, сортировку размеров, выдачу и проверку JWT-токенов.

## Деплой

Бэкенд и фронтенд разворачиваются как два отдельных сервиса на [Railway](https://railway.app) с автодеплоем из GitHub.
