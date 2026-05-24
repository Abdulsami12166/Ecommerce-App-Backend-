# Ecommerce Backend

Unified backend for:
- customer app APIs
- admin app APIs
- realtime Socket.IO events

## Run locally
```powershell
copy .env.example .env
npm run dev
```

## Required env
- `MONGO_URI`
- `JWT_SECRET`
- `ADMIN_JWT_SECRET`

## Create the real admin user
```powershell
$env:ADMIN_SEED_EMAIL="admin@example.com"
$env:ADMIN_SEED_PASSWORD="ReplaceWithStrongPassword123"
$env:ADMIN_SEED_NAME="Primary Admin"
npm run seed:admin
```

## Optional email env
- `RESEND_API_KEY`
- `RESEND_FROM`
- `EMAIL_FROM`
- SMTP fallback variables from `.env.example`

## Realtime
- Admin clients connect to the backend root Socket.IO server
- Admin clients must connect with a valid admin JWT and emit `subscribe-admin` after connecting
- Authenticated users are joined to `user:{userId}` rooms automatically
