# Multi-stage Docker build for NASA Meteor Mastery
# Stage 1: Build frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Copy package files
COPY package*.json ./
COPY src/ ./src/
COPY public/ ./public/

# Install dependencies and build
RUN npm ci --only=production && \
    npm run build

# Stage 2: Build backend
FROM python:3.11-slim AS backend-build

WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./

# Stage 3: Production runtime
FROM python:3.11-slim AS production

# Install runtime dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    nginx \
    redis-server \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash app

# Setup working directories
WORKDIR /app

# Copy built frontend from frontend-build stage
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Copy backend from backend-build stage
COPY --from=backend-build /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-build /app/backend ./backend

# Copy nginx configuration
COPY deployment/nginx.conf /etc/nginx/nginx.conf

# Copy startup script
COPY deployment/start.sh ./start.sh
RUN chmod +x ./start.sh

# Create directories and set permissions
RUN mkdir -p /var/log/nginx /var/log/app && \
    chown -R app:app /app /var/log/nginx /var/log/app

# Switch to non-root user
USER app

# Expose ports
EXPOSE 80
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["./start.sh"]