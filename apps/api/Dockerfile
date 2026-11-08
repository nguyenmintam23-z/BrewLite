FROM node:22-alpine

WORKDIR /app

COPY apps/api/package*.json ./apps/api/
RUN cd apps/api && npm ci

COPY . .

WORKDIR /app/apps/api
EXPOSE 3000

CMD ["npm", "run", "start:dev"]
