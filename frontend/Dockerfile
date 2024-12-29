# Use Node.js image for building the frontend
FROM node:16 as build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json .
RUN npm install

# Copy the application code
COPY . .

# Build the frontend application
RUN npm run build

# Use Nginx to serve the built frontend
FROM nginx:alpine

# Copy built files from the previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose Nginx's default port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]