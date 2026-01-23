# Use Node.js 22 Alpine as the base image
FROM node:22-alpine

# Install system dependencies
RUN apk update && apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    ffmpeg \
    build-base \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Clean any existing build artifacts
RUN rm -rf .next

# Generate Prisma client
RUN npx prisma generate

# Build the application (set dummy DATABASE_URL for build time)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
