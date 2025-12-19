# Backend Dockerfile
# Serveur Node.js avec Express pour l'API REST

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production


COPY . .
EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]

