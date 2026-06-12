FROM node:krypton-alpine AS base

RUN apk --no-cache add git python3 make gcc musl-dev g++ bash
WORKDIR /app/genesis
COPY package.json package-lock.json ./
COPY packages/bot/package.json ./packages/bot/
COPY packages/worker/package.json ./packages/worker/
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/
RUN npm ci --include-workspace-root -w @genesis/bot -w @genesis/worker -w @genesis/shared

FROM node:krypton-alpine AS release

LABEL org.opencontainers.image.source = "https://github.com/WFCD/genesis"
COPY --from=base --chown=node:node /app/genesis /app/genesis
WORKDIR /app/genesis
COPY --chown=node:node . .

## Add the wait script to the image to wait for the database to be available
ADD --chown=node:node https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait

RUN npm run build:prod

USER node
CMD /wait && node dist/bot/main.js
