# Stage 1: Build the Vite React application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package requirements
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application for production
# Note: GEMINI_API_KEY fallback logic in gemini.ts prevents build crashes if .env is not present.
RUN npm run build

# Stage 2: Serve the application
FROM nginx:alpine

# Remove standard nginx file
RUN rm -rf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*

# Copy new hardcoded conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy React build
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port and run
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
