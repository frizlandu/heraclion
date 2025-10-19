# Render: Backend deployment checklist

This file contains step-by-step instructions and copy/paste snippets to deploy the `backend/` service to Render and attach a managed PostgreSQL instance. Replace any placeholder values (like `<...>`) with your real values before running commands or pasting into the Render UI.

## 1) Create a managed PostgreSQL on Render

1. Go to https://dashboard.render.com → Databases → New Database → PostgreSQL.
2. Choose a plan, name it (e.g. `heraclion-prod-db`) and create.
3. After creation, click the database and copy the connection information (Host, Port, Database, User, Password).

Keep that information handy for the service environment variables.

## 2) Create the Web Service for backend

1. Render → New → Web Service.
2. Connect to GitHub and select your repository.
3. Configure service:
   - Name: `heraclion-backend` (or whatever you prefer)
   - Environment: `Node` (or leave automatic)
   - Region: as required
   - Branch: `main` (or your production branch)
   - Root Directory: `backend`
   - Build Command: `npm ci`
   - Release Command: `npm run migrate`  
     (This runs after build and before the service starts — useful for running DB migrations automatically.)
   - Start Command: `node server.js` (or `npm start` if you prefer)

4. Create the service.

## 3) Add Environment Variables

Open the Render service you created, go to the `Environment` tab and add the variables below (copy the left side as the key and paste your value):

```
NODE_ENV=production
DB_HOST=<your-db-host>
DB_PORT=5432
DB_NAME=<your-db-name>
DB_USER=<your-db-user>
DB_PASSWORD=<your-db-password>
DB_SSL=true
JWT_SECRET=<a-generated-secure-random-value>
CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>
PORT=3000
# Optional: S3/SMTP settings if you use them
S3_BUCKET=<bucket>
S3_ACCESS_KEY=<access-key>
S3_SECRET_KEY=<secret>
S3_REGION=<region>
SMTP_HOST=<smtp-host>
SMTP_PORT=<smtp-port>
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-pass>
```

Important: Do not commit secrets in your repo. Use Render UI for secrets.

## 4) Attach the Postgres database to the backend service

- In the Render dashboard, go to your Postgres database → "Connect" → "Add to Service" → select your backend service.
- This will automatically add the correct DB_* environment variables to your service.
- Double-check that the variable names match those expected by your app (see above).

## 5) Deploy and verify

- Click "Manual Deploy" or wait for automatic deployment after pushing to your repo.
- In the "Events" or "Logs" tab, check that the Release Command (`npm run migrate`) runs without error.
- Once deployed, open your backend URL (e.g. https://heraclion-backend.onrender.com/api/health)
- You should see `{ status: 'ok' }`.

## 6) Post-deploy checks

- Test main endpoints: `/api/health`, `/api/v1/documents`, `/api/v1/reports/stocks`
- From your Vercel frontend, verify that API requests succeed (CORS, auth, etc.)
- Test file uploads and websockets if your app uses them

## 7) Additional tips

- Render's disk is ephemeral: uploaded files will be lost on redeploy/restart. For persistent uploads, use S3 (AWS, Scaleway, etc.) and set the S3_* env vars.
- Use the "Logs" tab in Render for debugging.
- To rerun migrations manually: trigger a "Manual Deploy" or update the Release Command.

---

For automation (render.yaml, PowerShell scripts) or advanced setup, ask the assistant!
- If migrations fail, check DB credentials and permissions.

## 5) Health check

Once the service is live, run the health endpoint to confirm it is connected to the DB:

```powershell
Invoke-WebRequest -UseBasicParsing https://<your-backend>.onrender.com/api/health
```

## 6) (Optional) Triggering a manual migration locally

If you prefer to run migrations manually from your local machine before deploying, run:

```powershell
cd backend
npm ci
# ensure .env points to the prod DB (careful!) or use env vars inline
NODE_ENV=production DB_HOST=<host> DB_USER=<user> DB_PASSWORD=<pwd> npm run migrate
```

## 7) Notes and common issues

- If your app uses file uploads, Render's filesystem is ephemeral. Configure S3/Azure Blob and set env vars accordingly.
- For websockets, use `wss://` and ensure client points to the correct backend domain.
- If your service needs more memory/CPU, scale the instance size from the Render dashboard.

---

If you want, I can create a PowerShell template that prints the exact `Invoke-WebRequest` / `curl` commands for your environment when you provide the values. See `render-deploy-template.ps1` for a safe template with placeholders.
