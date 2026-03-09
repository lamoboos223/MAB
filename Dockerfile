# Build and run the Angular app (dev server)
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Expose Angular dev server port
EXPOSE 4200

# Run dev server; --host 0.0.0.0 so it's reachable from outside the container
CMD ["npm", "start", "--", "--host", "0.0.0.0"]
