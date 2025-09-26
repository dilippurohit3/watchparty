FROM node:20-alpine

WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY backend/package*.json ./
COPY shared/package*.json ../shared/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY backend/src ./src
COPY shared/src ../shared/src

# Build shared package
WORKDIR /app/../shared
RUN npm ci
RUN npm run build

# Build backend
WORKDIR /app
RUN npm run build

# Create uploads directory
RUN mkdir -p uploads

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S boltzy -u 1001
RUN chown -R boltzy:nodejs /app
USER boltzy

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
