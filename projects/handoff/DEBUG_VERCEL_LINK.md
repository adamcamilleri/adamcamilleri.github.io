# Debugging the Handoff → Vercel Link

Use this checklist to debug why "Connect Vercel" or deploy isn't working.

---

## 1. Which part isn't working?

| Symptom | Likely cause |
|--------|--------------|
| "Connect Vercel" button does nothing / wrong URL | API_BASE or CORS |
| Click Connect → Vercel OAuth page → error or redirect fails | OAuth app config |
| OAuth completes but "Vercel connected" doesn't show | Cookies / cross-origin |
| Deploy fails with "forbidden" or "permission denied" | OAuth token permissions (see below) |
| Deploy fails with "VERCEL_TOKEN not configured" | No token (OAuth or env) |

---

## 2. Environment variables (Vercel dashboard)

In **Vercel → Your project → Settings → Environment Variables**, ensure:

| Variable | Required for | Notes |
|----------|---------------|-------|
| `VERCEL_OAUTH_CLIENT_ID` | Connect Vercel (OAuth) | From Vercel OAuth app |
| `VERCEL_OAUTH_CLIENT_SECRET` | Connect Vercel (OAuth) | From Vercel OAuth app |
| `VERCEL_TOKEN` | Deploy (fallback) | Personal token if OAuth can't deploy |

**Redeploy** after changing env vars.

---

## 3. Vercel OAuth app configuration

1. Go to [vercel.com](https://vercel.com) → **Team** (sidebar) → **Settings** → **Apps** → **Create** (or edit existing).
2. **Callback URL** must include **exactly**:
   - `https://adamcamilleri-github-io.vercel.app/api/auth-vercel-callback`
   - `http://localhost:3000/api/auth-vercel-callback` (for local dev)
3. Copy **Client ID** and **Client Secret** into the project env vars above.

---

## 4. OAuth token permissions (important)

Vercel’s docs state:

> Permissions for issuing API requests and interacting with team resources are currently in **private beta**.

So OAuth tokens from "Sign in with Vercel" may **not** have permission to create deployments. If users connect via OAuth but deploy fails with "forbidden" or "You don't have permission", that’s expected.

**Workaround:** Use `VERCEL_TOKEN` (Option B in HANDOFF_SETUP.md). Deploys will go to your account instead of the visitor’s.

---

## 5. Cross-origin and cookies

- **Handoff on GitHub Pages** (`adamcamilleri.github.io`): API is `adamcamilleri-github-io.vercel.app`. Cookies are set on `vercel.app`. After OAuth, users are redirected to `vercel.app/projects/handoff/`.
- **Handoff on Vercel** (`adamcamilleri-github-io.vercel.app`): Same-origin; cookies work normally.

If you use GitHub Pages as the main URL, the status check (`/api/auth-vercel-status`) is cross-origin. Ensure `credentials: 'include'` is used (it is) and that the status endpoint returns correct CORS headers (it does for allowed origins).

---

## 6. Quick tests

### Test authorize URL

```text
https://adamcamilleri-github-io.vercel.app/api/auth-vercel-authorize
```

- If env vars are missing → JSON error.
- If configured → redirect to `vercel.com` OAuth.

### Test status (no auth)

```text
https://adamcamilleri-github-io.vercel.app/api/auth-vercel-status
```

- Should return `{"connected":false}` (or `true` if you have a cookie).

### Test from browser console (on Handoff page)

```javascript
fetch('https://adamcamilleri-github-io.vercel.app/api/auth-vercel-status', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## 7. Common fixes

1. **Redeploy** after adding/updating env vars.
2. **Check callback URL** in the OAuth app matches exactly (no trailing slash).
3. **Use VERCEL_TOKEN** if OAuth deploy fails due to permissions.
4. **Open DevTools → Network** and inspect the authorize/callback/status requests for errors.
