# Frontend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start dev server (accessible from host)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
