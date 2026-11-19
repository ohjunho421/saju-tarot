# Use Node.js 20 slim (Debian) for better compatibility with Prisma/native modules
FROM node:20-slim

# Install OpenSSL (required for Prisma)
RUN apt-get update -y && apt-get install -y openssl

# Set working directory
WORKDIR /app

# Copy root files
COPY . .

# Build client (서버가 같은 주소에서 화면도 내려준다)
# API는 같은 주소의 /api로 부른다. Vercel 빌드는 Vercel 쪽 VITE_API_URL을 그대로 쓴다
WORKDIR /app/client
RUN npm ci
# 빌드 결과(dist)만 쓰므로 클라이언트 의존성은 바로 지워 이미지를 줄인다
RUN VITE_API_URL=/api npm run build && rm -rf node_modules

# Install dependencies and build server
WORKDIR /app/server
RUN npm install
RUN npx prisma generate
RUN npm run build

# Expose port
EXPOSE 3000

# Start the server with Prisma migration
CMD ["sh", "-c", "npx prisma db push --accept-data-loss --skip-generate && node dist/index.js"]
