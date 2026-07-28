FROM node:krypton-alpine AS deps

RUN apk --no-cache add git python3 make gcc musl-dev g++ bash
WORKDIR /app/genesis
COPY package.json package-lock.json ./
COPY packages/bot/package.json ./packages/bot/
COPY packages/worker/package.json ./packages/worker/
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/
ENV HUSKY=0
RUN npm ci --include-workspace-root -w @genesis/bot -w @genesis/worker -w @genesis/shared

FROM deps AS build
COPY . .
ENV HUSKY=0
RUN npm run build:prod

# Prod-only install, separate from build tooling and from the final image assemble.
FROM node:krypton-alpine AS prod-deps

WORKDIR /app/genesis
COPY package.json package-lock.json ./
COPY packages/bot/package.json ./packages/bot/
COPY packages/worker/package.json ./packages/worker/
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/
# --ignore-scripts: root prepare runs husky (devDep), absent under --omit=dev
RUN npm ci --omit=dev --ignore-scripts --include-workspace-root \
      -w @genesis/worker -w @genesis/shared

FROM node:krypton-alpine AS release

LABEL org.opencontainers.image.source="https://github.com/WFCD/genesis"

WORKDIR /app/genesis
COPY --from=prod-deps --chown=node:node /app/genesis/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/genesis/package.json ./package.json
COPY --from=build --chown=node:node /app/genesis/dist ./dist

ADD --chown=node:node https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait

USER node
CMD ["/bin/sh", "-c", "/wait && node dist/worker/main.js"]
