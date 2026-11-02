English | [Русский](README.ru.md)

# USP Shop

An online store for a physical shoe and clothing shop in Semey, Kazakhstan. Catalog, cart, checkout, account area, and an admin panel for managing products and orders.

## Stack

**Backend** — Go, [gorilla/mux](https://github.com/gorilla/mux), MongoDB, JWT, bcrypt, logrus.
**Frontend** — Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion.
**External services** — MongoDB Atlas (database), Cloudinary (product photos), Resend (emails), Telegram Bot API (order notifications).

## Project structure

```
cmd/server/         backend entry point
config/              config loading, MongoDB connection
internal/
  models/            data structures
  repository/        MongoDB data access layer
  services/          business logic
  handlers/          HTTP handlers
pkg/
  email/             sending emails via Resend
  telegram/          order notifications
  jwt/                token generation and validation
  middleware/        auth, rate limiting, CORS, logging
  upload/             image uploads to Cloudinary
  logger/             logging
frontend/            Next.js application
```

## Running locally

### Backend

Create a `.env` file in the project root with the following variables:

```
MONGO_URI=mongodb+srv://...
DB_NAME=uspshop
JWT_SECRET=any-random-string
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

`JWT_SECRET` is required — the server refuses to start without it (or if it's set to `secret`). `MONGO_URI` must point at a replica set (any MongoDB Atlas tier works) since order creation uses transactions.

```bash
go run cmd/server/main.go
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The backend URL for the frontend is set in `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Tests

```bash
go test ./...
```

Unit tests cover the highest-risk business logic: stock checks, cart calculations, size sorting, and JWT token issuance/validation.

## Deployment

Backend and frontend are deployed as two separate services on [Railway](https://railway.app), with automatic deploys from GitHub.
