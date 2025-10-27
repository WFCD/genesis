FROM node:jod-alpine as base

RUN apk --no-cache add git python3 make gcc musl-dev g++ bash
WORKDIR /app/genesis
COPY package*.json ./
RUN npm ci

FROM node:jod-alpine as release

COPY --from=base --chown=node:node /app/genesis /app/genesis
WORKDIR /app/genesis
COPY --chown=node:node . .

## Add the wait script to the image to wait for the database to be available
ADD --chown=node:node https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait

WORKDIR /app/genesis/src/notifications

USER node
CMD /wait && node Worker.js
