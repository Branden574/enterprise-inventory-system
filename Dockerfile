# Use Node.js as base
FROM node:18

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install --production

# Copy backend source code
COPY backend/ ./

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
