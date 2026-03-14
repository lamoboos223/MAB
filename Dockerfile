# Build and run the Angular app (dev server) + CORS proxy
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Expose Angular dev server and CORS proxy ports
EXPOSE 4200 4201

# Run CORS proxy in background, then Angular dev server
CMD sh -c "node cors-proxy.mjs & npm start -- --host 0.0.0.0"
