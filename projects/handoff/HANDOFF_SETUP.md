# Handoff – Setup Guide

Follow these steps to get chat, save, and deploy working.

---

## Chat (required)

**GROQ_API_KEY** – Get a free key at [console.groq.com](https://console.groq.com). Add it in Vercel → Settings → Environment Variables (and in `.env` for local dev).

---

## Deploy button

### Option A: User OAuth (recommended for portfolio visitors)

Visitors can **Connect Vercel** so deploys go to *their* Vercel account. You need a Vercel OAuth app:

1. Go to [vercel.com](https://vercel.com) → your **team** (sidebar) → **Settings** → scroll to **Apps** → **Create**
2. **Application Name:** Handoff
3. **Callback URL:** Add both:
   - `https://adamcamilleri-github-io.vercel.app/api/auth/vercel/callback`
   - `http://localhost:3000/api/auth/vercel/callback` (for local dev)
4. Copy **Client ID** and **Client Secret**
5. In Vercel project: **Settings** → **Environment Variables**
   - **Name:** `VERCEL_OAUTH_CLIENT_ID` | **Value:** your client ID
   - **Name:** `VERCEL_OAUTH_CLIENT_SECRET` | **Value:** your client secret
6. **Redeploy**

> **Note:** OAuth tokens may have limited permissions. If users get "forbidden" on deploy, they can use Option B (your token) instead.

### Option B: Your token (deploys to your account)

**VERCEL_TOKEN** – Lets Handoff deploy to *your* Vercel account (no OAuth needed).

1. Go to [vercel.com](https://vercel.com) → **Account Settings** (click your avatar) → **Tokens**
2. Click **Create Token**
3. Name it (e.g. "Handoff deploy"), set expiration, click **Create**
4. **Copy the token immediately** (it's only shown once)
5. In your Vercel project: **Settings** → **Environment Variables**
6. Add:
   - **Name:** `VERCEL_TOKEN`
   - **Value:** your token
   - **Environment:** Production (and Preview if you want)
7. **Redeploy** (Deployments → ⋮ on latest → Redeploy)

**Cleaner deploy URLs** – Add `HANDOFF_DEPLOY_PREFIX` (e.g. `adamcamilleri-site`) in Vercel env vars. Deployed URLs will look like `adamcamilleri-site-handoff-x7k2m9.vercel.app` instead of long random names.

---

## Save design button

**MONGODB_URI** – Lets Handoff save designs to a database.

### Option A: MongoDB Atlas (free tier)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account
2. Create a **free cluster** (M0)
3. Click **Connect** → **Drivers** → copy the connection string (looks like `mongodb+srv://user:pass@cluster.mongodb.net/`)
4. Replace `<password>` with your database user password
5. Add `handoff` to the end: `mongodb+srv://user:pass@cluster.mongodb.net/handoff`
6. In Vercel: **Settings** → **Environment Variables**
   - **Name:** `MONGODB_URI`
   - **Value:** your connection string
7. **Redeploy**

### Option B: Local Docker

When you run `docker compose up`, MongoDB runs in a container. The API uses `mongodb://mongo:27017/handoff` automatically. No Atlas needed for local dev.

---

## Where to add env vars

| Where you use Handoff | Where to add vars |
|----------------------|-------------------|
| **Live site** (adamcamilleri.github.io) | Vercel → your project → Settings → Environment Variables |
| **Local** (npm run dev or Docker) | `.env` file in repo root (copy from `.env.example`) |

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| "Demo mode: no API configured" | `API_BASE` is empty or wrong in `script.js` |
| "GROQ_API_KEY not configured" | Add in Vercel → Environment Variables, then redeploy |
| "VERCEL_TOKEN not configured" | Add token in Vercel → Environment Variables, redeploy |
| "MONGODB_URI not configured" | Add Atlas URI in Vercel, or use Docker locally |
| CORS errors | Your Handoff page must be served from `adamcamilleri.github.io` or `localhost` |
