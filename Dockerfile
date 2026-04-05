FROM node:20-bookworm-slim AS base

ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=file:./data/dev.db

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app


FROM base AS deps

COPY package.json package-lock.json ./
RUN npm ci


FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate && npx prisma db push && npm run build


FROM base AS runner

ENV NODE_ENV=production

RUN mkdir -p /app/data

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data

RUN chown -R node:node /app/data /app/generated /app/.next /app/public /app/node_modules

USER node

EXPOSE 3000
VOLUME ["/app/data"]

CMD ["node", "server.js"]
