FROM node:krypton-alpine AS base

WORKDIR /app/genesis
COPY package.json package-lock.json ./
COPY packages/bot/package.json ./packages/bot/
COPY packages/worker/package.json ./packages/worker/
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/
RUN npm ci --include-workspace-root -w @genesis/web

FROM node:krypton-alpine AS release

LABEL org.opencontainers.image.source = "https://github.com/WFCD/genesis"

WORKDIR /app/genesis
COPY --from=base /app/genesis/node_modules ./node_modules
COPY . .

WORKDIR /app/genesis/packages/web
ENV SCOPE=WEB
ENV NODE_ENV=production
RUN npm run build

EXPOSE 3131
CMD ["npm", "run", "start"]
