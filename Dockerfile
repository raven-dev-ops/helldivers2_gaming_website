# Use official Node image
FROM node:22.12.0-alpine

# Set working directory
WORKDIR /app

# Silence Node deprecation warnings
ENV NODE_OPTIONS=--no-deprecation

# Install pnpm directly (skip Corepack) and required build tools
RUN apk add --no-cache python3 make g++ && npm i -g pnpm@9.12.3

# Only copy manifest for better caching
COPY package.json ./

# Install dependencies
RUN pnpm install

# Copy all app files
COPY . .

# Build the Next.js app then remove dev dependencies (skip lint in CI to avoid blocking deploys)
RUN pnpm run build && pnpm prune --prod

# Set production environment for runtime
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start the app
CMD ["pnpm", "start"]
