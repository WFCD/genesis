FROM node:krypton-alpine AS base

RUN apk --no-cache add git python3 make gcc musl-dev g++ bash
WORKDIR /app/genesis
COPY package*.json ./
RUN npm ci

FROM node:krypton-alpine AS release

LABEL org.opencontainers.image.source = "https://github.com/WFCD/genesis"
COPY --from=base --chown=node:node /app/genesis /app/genesis
WORKDIR /app/genesis
COPY --chown=node:node . .

ADD --chown=node:node https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait

RUN npm run build:prod

USER node
CMD /wait && node dist/worker/main.js
