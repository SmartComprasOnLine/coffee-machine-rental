# Use Node.js LTS version with smaller Alpine base
FROM node:18-alpine

# Add necessary build dependencies
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# Install dependencies with reduced memory usage
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm ci --only=production --no-audit --no-optional && \
    npm cache clean --force

# Remove build dependencies
RUN apk del python3 make g++

# Bundle app source
COPY . .

# Expose port
EXPOSE 3000

# Set Node.js to run in production mode
ENV NODE_ENV=production

# Start the application with reduced memory footprint
CMD ["node", "--optimize-for-size", "--max-old-space-size=512", "server.js"]
