# Handoff – Setup Guide

## Environment Variables

| Variable | Required for | Where to get it |
|----------|-------------|-----------------|
| `GEMINI_API_KEY` | Chat (required) | [aistudio.google.com](https://aistudio.google.com) → Get API key |
| `VERCEL_TOKEN` | Deploy button | Vercel → Account Settings → Tokens → Create |
| `VERCEL_OAUTH_CLIENT_ID` | "Connect Vercel" OAuth | Vercel → Team → Settings → Apps → Create |
| `VERCEL_OAUTH_CLIENT_SECRET` | "Connect Vercel" OAuth | Same as above |

Add all vars in **Vercel → Your project → Settings → Environment Variables**, then **Redeploy**.
For local dev, add to `.env` (copy from `.env.example`).

---

## Deploy Button Setup

**Option A – Your Vercel token** (recommended): Set `VERCEL_TOKEN`. Deploys go to your account, no OAuth needed.

**Option B – User OAuth**: Lets visitors deploy to their own Vercel account. Create a Vercel OAuth app (Team → Settings → Apps → Create), set callback URL to your project's `/callback`, then add `VERCEL_OAUTH_CLIENT_ID` and `VERCEL_OAUTH_CLIENT_SECRET`. Note: Vercel OAuth deploy permissions are in private beta and may return "forbidden" — fall back to Option A if so.

**Custom deploy URL prefix**: Set `HANDOFF_DEPLOY_PREFIX` (e.g. `myname-site`) to get cleaner URLs like `myname-site-handoff-x7k2m9.vercel.app`.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "GEMINI_API_KEY not configured" | Add key in Vercel env vars, redeploy |
| "VERCEL_TOKEN not configured" | Add token in Vercel env vars, redeploy |
| "Connect Vercel" button does nothing | Check `API_BASE` in script.js; check CORS |
| OAuth redirect fails | Verify callback URL in OAuth app matches `/callback` exactly |
| Deploy fails with "forbidden" | OAuth permissions issue — use `VERCEL_TOKEN` (Option A) instead |
| API routes return 404 | Vercel → Project → Settings → General: ensure Root Directory is empty or `.` |
| CORS errors | Page must be served from `adamcamilleri.github.io` or `localhost` |

**After any env var change, redeploy.** Check Vercel function logs for detailed errors.
