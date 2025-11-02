FROM node:18-alpine AS development
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

COPY package*.json ./
RUN npm install

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

COPY . .

EXPOSE 4001

CMD ["npm", "run", "start:dev"]