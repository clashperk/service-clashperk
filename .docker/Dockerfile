FROM node:16-slim as build

WORKDIR /

COPY . .

RUN npm ci

RUN npm run build

CMD ["npm", "start"]
