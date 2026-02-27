# Handoff – Vercel Setup

Follow these steps to connect the Handoff chat to Anthropic and make it work live.

---

## 1. Get an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Go to **API Keys** and create a new key
4. Copy the key (you won’t see it again)

---

## 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and log in (use GitHub if you use it)
2. Click **Add New** → **Project**
3. **Import** your `adamcamilleri.github.io` repository
4. Leave the settings as default and click **Deploy**
5. Wait for the deployment to finish
6. Copy the deployment URL (e.g. `https://adamcamilleri-github-io-abc123.vercel.app`)

---

## 3. Add your Anthropic key in Vercel

1. In Vercel, open your project
2. Go to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your Anthropic API key
   - **Environment:** Production (and Preview if you want)
4. Click **Save**
5. Go to **Deployments**, open the **⋮** menu on the latest deployment, and choose **Redeploy** so the new env var is used

---

## 4. Point Handoff at your API

1. Open `projects/handoff/script.js` in your editor
2. Set `API_BASE` to your Vercel URL **plus** `/api`:
   ```js
   const API_BASE = 'https://your-project.vercel.app/api';
   ```
   Example: if your URL is `https://adamcamilleri-github-io-xyz.vercel.app`, use:
   ```js
   const API_BASE = 'https://adamcamilleri-github-io-xyz.vercel.app/api';
   ```
3. Save and push to GitHub

---

## 5. Test

- If your portfolio is on **GitHub Pages**, the Handoff page will load from `adamcamilleri.github.io/projects/handoff/` and call your Vercel API
- If you’re testing locally, run a simple server (e.g. `npx serve .` from the repo root) so CORS works, then open `http://localhost:3000/projects/handoff/`
- Send a message in the chat; the AI response should update the preview iframe

---

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| "Demo mode: no API configured" | `API_BASE` is empty or wrong in `script.js` |
| "ANTHROPIC_API_KEY not configured" | Add `ANTHROPIC_API_KEY` in Vercel → Settings → Environment Variables, then redeploy |
| CORS errors | Your Handoff page must be served from `adamcamilleri.github.io` or `localhost` (file:// URLs won’t work) |
