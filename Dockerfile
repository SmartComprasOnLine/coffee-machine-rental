# Use Node.js LTS version with smaller Alpine base
FROM node:18-alpine

# Install curl and network tools for debugging
RUN apk add --no-cache curl iputils

# Create app directory and ensure proper permissions
WORKDIR /usr/src/app
RUN chown node:node /usr/src/app

# Switch to non-root user
USER node

# Install app dependencies
COPY --chown=node:node package*.json ./

# Install dependencies with production only
ENV NODE_ENV=production
RUN npm install --production --no-audit

# Bundle app source
COPY --chown=node:node . .

# Create temp directory with proper permissions
RUN mkdir -p /usr/src/app/temp && chown -R node:node /usr/src/app/temp

# Expose port
EXPOSE 3000

# Set host to listen on all interfaces
ENV HOST=0.0.0.0

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start the application with reduced memory footprint
CMD ["node", "--optimize-for-size", "--max-old-space-size=256", "server.js"]
