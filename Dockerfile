FROM node:20-slim AS builder
WORKDIR /app

# Install deps (includes postinstall -> prisma generate)
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install

# Build the app
COPY . .
RUN npm run build

# ---- Runtime image ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Standalone output already contains static/, public/ (copied in by npm run build)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "server.js"]
