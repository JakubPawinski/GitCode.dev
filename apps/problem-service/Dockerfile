# Development stage
FROM node:20-alpine AS development

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 4002

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run start:dev"]

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npx prisma generate

EXPOSE 4002

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && npm run start:prod"]