# Production environment variables and how to set them

This file explains the minimal environment variables required to run the backend and frontend in production.

Backend (Render web service environment variables)

- NODE_ENV=production
- PORT=3000
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD: Use the managed Postgres instance credentials
- JWT_SECRET: a long random secret used to sign JWTs (do not share)
- JWT_EXPIRES_IN=24h
- LOG_LEVEL=info
- ALLOWED_ORIGINS: frontend URL(s), e.g. https://app.example.com

Frontend (Vercel project environment variables)

- REACT_APP_API_BASE_URL: https://api.example.com
- REACT_APP_WS_URL: wss://api.example.com (optional)

Example strong JWT secret (generated for convenience — rotate it in production):

JWT_SECRET=9f3b8f1c2d9b6e7a3c1a4b2d7f8e9c6b4d5a7e8f9c0b1a2d3e4f5a6b7c8d9e0

How to use

1. Do NOT commit real secrets to Git. Use provider environment variable settings (Render/Vercel).
2. Copy the values from `backend/.env.production` and `frontend/.env.production` into the provider's UI.
3. For Render, configure a managed Postgres and attach it to the service, then set `DB_HOST`, `DB_USER`, etc.
4. Add a release command on Render to run migrations: `npm run migrate` (see `backend/package.json`).
