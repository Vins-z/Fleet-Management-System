# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy dependency manifests and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy application sources
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve built assets using Nginx
FROM nginx:alpine

# Copy built artifacts from builder stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx configuration with reverse proxy for API
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose standard web port
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
