# Handoff – Setup Guide

Follow these steps to get chat, save, and deploy working.

---

## Chat (required)

**GROQ_API_KEY** – Get a free key at [console.groq.com](https://console.groq.com). Add it in Vercel → Settings → Environment Variables (and in `.env` for local dev).

---

## Deploy button

**VERCEL_TOKEN** – Lets Handoff deploy generated sites to your Vercel account.

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
