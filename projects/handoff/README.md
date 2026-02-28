# Handoff

AI-powered website design in conversation. Chat to customize layout, colors, copy, and structure—then preview the live site and deploy it.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML, CSS, JavaScript |
| **API** | Node.js (Vercel serverless), TypeScript (validation) |
| **Database** | MongoDB (NoSQL) |
| **AI** | Groq API (Llama 3.3) |
| **Deploy** | Vercel API |
| **Payments** | Stripe |
| **Testing** | Jest (unit), Cypress (E2E), jMeter (load) |
| **Hosting** | GitHub Pages + Vercel |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|--------------|
| `/api/chat` | POST | Design requests, multi-turn chat, element edits |
| `/api/deploy` | POST | Deploy generated HTML to Vercel |
| `/api/save-design` | POST | Save design to MongoDB |
| `/api/get-designs` | GET | List saved designs |
| `/api/get-design` | GET | Get design by ID |
| `/api/create-payment-link` | POST | Create Stripe payment links |

Import `Handoff-API.postman_collection.json` into Postman to test the APIs.

## Security Considerations (OWASP)

- **Input validation**: Payload size limits and string length caps on user-supplied HTML and text (mitigates injection, DoS)
- **CORS**: Restrictive origin whitelist for API access
- **Authentication**: Deploy and payment endpoints require server-side tokens (not exposed to client)
- **Data handling**: No persistent storage of sensitive data in the frontend; API keys stored as environment variables

## Local Development

**Option A – Docker (full stack, recommended)** (from repo root)

Runs Express API + MongoDB in containers. Required for save-design locally.
```bash
cp .env.example .env   # Add GROQ_API_KEY, etc.
docker-compose up
```
Open http://localhost:3000/projects/handoff/ – chat, deploy, save, and payments work against the local API. MongoDB runs in a container; no Atlas needed.

**Option B – Node** (from repo root)
```bash
cp .env.example .env
npm run dev
```
For save-design you need MONGODB_URI (e.g. Atlas); otherwise chat and deploy work.

**Production** – See [HANDOFF_SETUP.md](./HANDOFF_SETUP.md) for Vercel deployment.

## License

MIT
