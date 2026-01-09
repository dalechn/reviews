# Use Node.js 22 Alpine as the base image
FROM node:22-alpine

# Install Python and build tools for native dependencies
RUN apk add --no-cache python3 py3-pip make g++

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
