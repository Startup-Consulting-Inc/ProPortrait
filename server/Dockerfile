# ── ProPortrait API — Cloud Run container ────────────────────────────────────
# Build from repo root: docker build -f server/Dockerfile -t proportrait-api .
# Run locally:          docker run -p 8080:8080 --env-file .env.local proportrait-api

FROM node:22-alpine

WORKDIR /app

# sharp requires glibc-compatible binaries on Alpine
RUN apk add --no-cache libc6-compat

# Install dependencies (all in root package.json)
COPY package*.json ./
RUN npm ci --ignore-scripts && npx --yes sharp-install 2>/dev/null || true

# Copy server source and shared tsconfig
COPY server ./server
COPY tsconfig.json ./

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["npx", "tsx", "server/index.ts"]
