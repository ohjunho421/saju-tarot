# Use Node.js 20 based on nixpacks.toml
FROM node:20-alpine

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
