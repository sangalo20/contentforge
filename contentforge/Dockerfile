# ==========================================
# STAGE 1: Build the Vite Frontend
# ==========================================
FROM node:20-slim AS builder

WORKDIR /app/frontend

# Install dependencies first (leverage Docker cache)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy frontend source code and build it
COPY frontend ./
RUN npm run build

# ==========================================
# STAGE 2: Setup the Express Backend
# ==========================================
FROM node:20-slim

WORKDIR /app

# Install backend dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --only=production

# Copy backend source code
COPY backend ./

# Copy the built static files from Stage 1 into the backend's 'public' folder
# (server.js is configured to serve them from there)
COPY --from=builder /app/frontend/dist ./public

# Cloud Run defaults to port 8080
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
