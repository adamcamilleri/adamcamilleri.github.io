# Technology Stack

**Analysis Date:** 2026-03-06

## Languages

**Primary:**
- JavaScript (Node.js CommonJS) - Backend API handlers in `api/*.js`, server entry in `server.js`
- JavaScript (ESM) - Chatbot pipeline in `c:\Users\adamc\OneDrive\Documents\GitHub\chatbotpipeline\pipeline.mjs`
- TypeScript - Validation utilities compiled from `src-ts/validation.ts` → `dist/validation.js`
- HTML/CSS - Frontend pages: `index.html`, `handoff/index.html`, `songdle/`, `projects/*/`

**Secondary:**
- TypeScript (strict mode, `tsconfig.json`) - Used only for `src-ts/` compilation; not used for runtime API layer

## Runtime

**Environment:**
- Node.js 20 (Dockerfile: `FROM node:20-alpine`; chatbotpipeline requires `>=18.0.0`)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present in both repos

## Frameworks

**Core:**
- Express 4.22.x - Local dev server in `server.js`; routes all `/api/*` traffic to serverless handler functions
- Vercel Serverless Functions - Production runtime; each file in `api/` is a standalone handler module

**Testing:**
- Jest 29.7.x - Unit tests in `__tests__/`
- Cypress 13.6.x - E2E tests in `cypress/e2e/`
- Supertest 6.3.x - HTTP integration assertions used in unit tests

**Build/Dev:**
- TypeScript 5.9.x - Compiles `src-ts/` to `dist/` (target ES2020, module commonjs)
- start-server-and-test 2.0.x - Spins up Express before running Cypress
- serve 14.2.x - Static file serving utility (dev dependency)
- Apache JMeter - Load test plans in `jmeter/handoff-load-test.jmx` and `jmeter/handoff-load-test-local.jmx`

## Key Dependencies

**Critical (portfolio/Handoff repo):**
- `express` ^4.22.1 - HTTP server for local dev and Docker
- `mongodb` ^6.21.0 - MongoDB Atlas driver; design persistence via `api/_lib/mongodb.js`
- `dotenv` ^17.3.1 - `.env` loading for local/Docker dev

**Critical (chatbotpipeline repo):**
- `@anthropic-ai/sdk` ^0.39.0 - Anthropic Claude client (imported but Groq REST API is used directly for Handoff)
- `cheerio` ^1.0.0 - HTML scraping of target business websites
- `csv-parse` ^5.5.6 - Parses business lead CSV files
- `nodemailer` ^8.0.1 - Gmail SMTP outreach emails
- `dotenv` ^16.4.7 - Environment variable loading

**Infrastructure (portfolio/Handoff repo):**
- `cypress` ^13.6.0 - E2E browser testing
- `jest` ^29.7.0 - Unit/integration test runner
- `supertest` ^6.3.4 - HTTP assertion layer for Jest tests

## Configuration

**Environment (portfolio/Handoff repo):**
- Template documented in `.env.example`
- Required: `GROQ_API_KEY` (Groq LLM API)
- Optional: `VERCEL_TOKEN`, `VERCEL_OAUTH_CLIENT_ID`, `VERCEL_OAUTH_CLIENT_SECRET`, `STRIPE_SECRET_KEY`, `MONGODB_URI`, `HANDOFF_DEPLOY_PREFIX`, `API_KEYS`
- `.env` present locally; env vars set in Vercel dashboard for production

**Environment (chatbotpipeline repo):**
- Required: `NETLIFY_TOKEN`, `GROQ_API_KEY`, `GMAIL_USER`, `GMAIL_APP_PASS`
- No `.env.example` exists; variables documented only in `pipeline.mjs` startup checks

**Build:**
- `tsconfig.json`: `rootDir: ./src-ts`, `outDir: ./dist`, `strict: true`, `target: ES2020`, `module: commonjs`
- `vercel.json`: `buildCommand: npm run build`, `outputDirectory: .` (serves repo root as static)
- `cypress.config.js`: baseUrl `http://localhost:3000`, spec pattern `cypress/e2e/**/*.cy.js`
- `docker-compose.yml`: Defines `web` (Node 20 Alpine) + `mongo` (mongo:7) services; mounts `mongo_data` volume

## Platform Requirements

**Development:**
- Node.js 20+, npm
- Docker + Docker Compose (optional; for full local stack with MongoDB)
- `.env` file copied from `.env.example` with keys filled in

**Production:**
- Vercel (portfolio/Handoff site) - serverless functions from `api/`, static files from repo root
- MongoDB Atlas (free tier supported) - connection via `MONGODB_URI`
- GitHub Pages (alternative static host; `CNAME` present for `adamcamilleri.com`)
- Netlify (chatbotpipeline) - generated chatbot HTML pages deployed per business

---

*Stack analysis: 2026-03-06*
