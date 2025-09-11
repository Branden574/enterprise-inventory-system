# Multi-stage build
# Stage 1: Build frontend
FROM node:18 AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup backend and serve frontend
FROM node:18

WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm install --production

# Copy backend source code
COPY backend/ ./

# Copy built frontend from previous stage - ensure all files are copied correctly
COPY --from=frontend-build /app/frontend/build ./public
RUN echo "Frontend build copied at $(date)" > ./public/build-timestamp.txt

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
