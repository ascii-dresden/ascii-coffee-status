FROM node:alpine as builder
WORKDIR /usr/src/app
EXPOSE 3000

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:alpine as runner
WORKDIR /usr/src/app
EXPOSE 3000

ENTRYPOINT node /usr/src/app/dist/index.js

COPY --from=builder /usr/src/app/node_modules /usr/src/app/node_modules
COPY --from=builder /usr/src/app/dist /usr/src/app/dist
COPY views /usr/src/app/views
