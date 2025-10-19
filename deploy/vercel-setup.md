# Vercel: Frontend deployment checklist

This document explains how to deploy the `frontend/` app (Create React App) to Vercel. Replace placeholders with your actual values.

## 1) Import project

1. Go to https://vercel.com/new
2. Select Git provider (GitHub) and pick your repository.
3. In the import settings set:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. Click `Deploy`.

## 2) Environment variables (Vercel Project → Settings → Environment Variables)

Add the following variables (in Vercel UI):

```
REACT_APP_API_BASE_URL=https://<your-backend>.onrender.com
REACT_APP_WS_URL=wss://<your-backend>.onrender.com
REACT_APP_ENV=production
```

Note: For CRA, env vars used in client code must start with `REACT_APP_`.

## 3) Custom domain & SSL

1. Add your custom domain in Vercel (Domains → Add Domain).
2. Follow DNS instructions (CNAME or ANAME). Vercel will automatically provision SSL certificate.

## 4) Verify

After deploy completes, visit your Vercel domain (or custom domain) and confirm the app loads. Test data fetching to the backend.

```powershell
Invoke-WebRequest -UseBasicParsing https://your-frontend.vercel.app | Select-Object StatusCode
```

## 5) Notes
- If your frontend tries to fetch `/api/...` and you see 404 that comes from the backend, ensure `REACT_APP_API_BASE_URL` points to the backend domain (not to Vercel's preview domain). Use absolute URLs in production.
- Vercel auto-deploys on git push to the connected repo/branch.
