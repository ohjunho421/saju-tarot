# Use Node.js 20 slim (Debian) for better compatibility with Prisma/native modules
FROM node:20-slim

# Install OpenSSL (required for Prisma)
RUN apt-get update -y && apt-get install -y openssl

# Set working directory
WORKDIR /app

# Copy root files
COPY . .

# Install dependencies and build server
WORKDIR /app/server
RUN npm install
RUN npx prisma generate
RUN npm run build

# Expose port
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
