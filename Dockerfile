# Use Node.js LTS version with smaller Alpine base
FROM node:18-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# Install dependencies with production only
ENV NODE_ENV=production
RUN npm install --production --no-audit

# Bundle app source
COPY . .

# Expose port
EXPOSE 3000

# Start the application with reduced memory footprint
CMD ["node", "--optimize-for-size", "--max-old-space-size=256", "server.js"]
