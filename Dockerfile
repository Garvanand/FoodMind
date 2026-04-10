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

# Stage 2: Serve the application using a lightweight Nginx web server
FROM nginx:alpine

# Install gettext for envsubst
RUN apk add --no-cache gettext

# Remove standard nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy the nginx configuration file
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy the compiled React build from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Google Cloud Run injects the listening port via the $PORT environment variable.
# We map $PORT to Nginx using the standard nginx template directory.
ENV PORT=8080
EXPOSE $PORT

# Run Nginx
CMD ["nginx", "-g", "daemon off;"]
