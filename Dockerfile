FROM node:20-bookworm-slim


ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV DATABASE_URL=file:./data/dev.db

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN mkdir -p /app/data

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate && npm run build

ENV NODE_ENV=production

RUN chown -R node:node /app/data

USER node

EXPOSE 3000
VOLUME ["/app/data"]

CMD ["sh", "-c", "npx prisma db push && npm run start"]
