# Full stack: portfolio + Handoff API (frontend + backend in one container)
# Run: docker-compose up
# Open: http://localhost:3000/projects/handoff/
# Requires .env with GROQ_API_KEY (and optionally VERCEL_TOKEN, STRIPE_SECRET_KEY)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
