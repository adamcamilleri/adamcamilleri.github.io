# External Integrations

**Analysis Date:** 2026-03-06

## APIs & External Services

**AI / LLM:**
- Groq (llama-3.3-70b-versatile) - Powers the Handoff chat and chatbot pipeline website builder
  - SDK/Client: Direct `fetch` to `https://api.groq.com/openai/v1/chat/completions`
  - Auth: `GROQ_API_KEY` env var (required in both repos)
  - Used in: `api/chat.js`, `c:\Users\adamc\OneDrive\Documents\GitHub\chatbotpipeline\pipeline.mjs`

- Anthropic Claude - Imported as dependency in chatbotpipeline (`@anthropic-ai/sdk ^0.39.0`) but Groq is the active LLM call; SDK may be unused at runtime

**Deployment Platforms:**
- Vercel Deployments API - Handoff "Deploy to Vercel" button; deploys user-generated HTML as a new Vercel project
  - Endpoint: `https://api.vercel.com/v13/deployments`
  - Auth: `VERCEL_TOKEN` (env var) or user's own token from OAuth cookie `vercel_access_token`
  - Used in: `api/deploy.js`

- Netlify API - Chatbot pipeline; deploys one HTML page per business as a Netlify site
  - Endpoint: `https://api.netlify.com/api/v1`
  - Auth: `NETLIFY_TOKEN` env var
  - Used in: `c:\Users\adamc\OneDrive\Documents\GitHub\chatbotpipeline\pipeline.mjs`

**Payments:**
- Stripe Payment Links API - Creates one-time payment links for Handoff buy/donate buttons
  - Endpoint: `https://api.stripe.com/v1/payment_links`
  - Auth: `STRIPE_SECRET_KEY` env var (optional; feature disabled if absent)
  - Used in: `api/create-payment-link.js`

**Music / Audio:**
- Spotify Embed Scraping - Extracts 30-second preview MP3 URLs by scraping `open.spotify.com/embed/track/{id}`; no API key required; parses `__NEXT_DATA__` JSON from embed page
  - Toggle: `SPOTIFY_ENABLED=true` env var required; otherwise returns `spotify_disabled`
  - Used in: `api/spotify-preview.js`

- iTunes Preview URLs - Static MP3 preview URLs stored in `projects/songdle/songs.json`; streamed server-side by `api/songdle-stream.js` to bypass browser CORS

**Form Submissions:**
- FormSubmit.co - Third-party form backend embedded in AI-generated HTML pages (no server-side integration; `action="https://formsubmit.co/{email}"` injected into generated HTML by `api/chat.js`)

## Data Storage

**Databases:**
- MongoDB Atlas (production) / MongoDB 7 Docker container (local)
  - Connection: `MONGODB_URI` env var (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/handoff`)
  - Client: `mongodb` npm driver v6, connection helper at `api/_lib/mongodb.js`
  - Database name: `handoff`
  - Collections: `designs` (stores generated HTML pages with `html`, `name`, `createdAt` fields)
  - Used by: `api/save-design.js`, `api/get-designs.js`, `api/get-design.js`

**File Storage:**
- Local filesystem only - `projects/songdle/songs.json` read at runtime by `api/soundcloud-daily.js` and `api/songdle-stream.js`
- Chatbot pipeline writes generated HTML to `./output/` directory and site registry to `./sites.json`

**Caching:**
- MongoDB connection is module-level cached in `api/_lib/mongodb.js` (single `cached` variable) to survive serverless warm invocations
- No Redis or external cache layer

## Authentication & Identity

**Custom API Key Auth:**
- Implementation: `api/_lib/api-key.js` checks `X-API-Key` request header against `API_KEYS` env var (comma-separated list)
- Applied to: `api/chat.js`, `api/deploy.js`, `api/create-payment-link.js`, `api/save-design.js`
- Behavior: If `API_KEYS` is not set, all requests are allowed through

**Vercel OAuth (PKCE flow):**
- Allows users to connect their own Vercel account to enable "Deploy" button with their token
- Provider: Vercel OAuth (`https://vercel.com/oauth/authorize`)
- Token endpoint: `https://api.vercel.com/login/oauth/token`
- Scopes: `openid email profile offline_access`
- State/nonce/PKCE: Generated with `crypto` module; stored in `HttpOnly` cookies (`oauth_state`, `oauth_nonce`, `oauth_code_verifier`)
- Tokens stored as cookies: `vercel_access_token` (expires with `expires_in` from Vercel, max 24h), `vercel_refresh_token` (30 days)
- Env vars required: `VERCEL_OAUTH_CLIENT_ID`, `VERCEL_OAUTH_CLIENT_SECRET`
- Routes: `api/oauth.js` handles authorize, callback, and status actions
- OAuth app must be created at `vercel.com → Account → OAuth Applications`

## Monitoring & Observability

**Error Tracking:**
- None detected - no Sentry, Datadog, or similar integration

**Logs:**
- `console.error` and `console.log` used directly in API handlers; captured by Vercel's built-in log streaming in production

## CI/CD & Deployment

**Hosting:**
- Primary: Vercel (portfolio site + Handoff API serverless functions)
- Alternative static: GitHub Pages (`CNAME` file present for `adamcamilleri.com`)
- Docker: `Dockerfile` + `docker-compose.yml` for self-hosted or local full-stack development

**CI Pipeline:**
- None detected - no GitHub Actions, CircleCI, or similar workflow files present

**Build on Deploy:**
- Vercel runs `npm run build` (TypeScript compilation) then serves repo root as `outputDirectory`

## Environment Configuration

**Required env vars (portfolio/Handoff):**
- `GROQ_API_KEY` - LLM access (chat feature breaks without this)
- `MONGODB_URI` - design save/load (optional feature)
- `VERCEL_TOKEN` - deploy button without OAuth (optional)
- `VERCEL_OAUTH_CLIENT_ID` + `VERCEL_OAUTH_CLIENT_SECRET` - user OAuth connect (optional)
- `STRIPE_SECRET_KEY` - payment links (optional)
- `SPOTIFY_ENABLED` - enable Spotify preview proxy (optional, set to `true`)
- `HANDOFF_DEPLOY_PREFIX` - customize Vercel project name prefix (optional)
- `API_KEYS` - comma-separated API keys for programmatic access (optional)

**Required env vars (chatbotpipeline):**
- `NETLIFY_TOKEN` - site deployment (required; pipeline exits if missing)
- `GROQ_API_KEY` - LLM (required; pipeline exits if missing)
- `GMAIL_USER` + `GMAIL_APP_PASS` - outreach email via Gmail SMTP (required; pipeline exits if missing)

**Secrets location:**
- Local: `.env` file (gitignored); template at `.env.example`
- Production: Vercel dashboard → Project → Settings → Environment Variables

## Webhooks & Callbacks

**Incoming:**
- `/callback` (GET) - Vercel OAuth redirect URI; handled by `api/oauth.js` with `action=callback`

**Outgoing:**
- None - no webhooks sent to external services

---

*Integration audit: 2026-03-06*
