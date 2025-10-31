FROM node:18-alpine AS development
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 4050

CMD ["npm", "run", "dev"]