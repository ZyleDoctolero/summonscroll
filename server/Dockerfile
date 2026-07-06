# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including devDeps for tsc)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Expose the API port
EXPOSE 3001

# Health check — verifies the server is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

# Run the server
CMD ["node", "dist/index.js"]
