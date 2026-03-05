# Handoff

Website design via conversation. Chat to build and refine a site, preview it live, then deploy.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML, CSS, JavaScript |
| **API** | Node.js (Vercel serverless) |
| **Chat API** | Groq |
| **Deploy** | Vercel API |
| **Testing** | Jest (unit), Cypress (E2E), jMeter (load) |
| **Hosting** | GitHub Pages + Vercel |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Design requests, multi-turn chat, element edits |
| `/api/deploy` | POST | Deploy generated HTML to Vercel |

## Security

- Input validation with payload size limits (mitigates injection, DoS)
- Restrictive CORS origin whitelist
- API keys stored as Vercel environment variables, never exposed to client

## Local Development

```bash
cp .env.example .env   # Add GEMINI_API_KEY, VERCEL_TOKEN
npm run dev
```

Open http://localhost:3000/projects/handoff/

**Production setup** → [HANDOFF_SETUP.md](./HANDOFF_SETUP.md)

## License

MIT
