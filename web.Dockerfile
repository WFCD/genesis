FROM node:krypton-alpine AS base

WORKDIR /app/genesis
COPY package*.json ./
COPY web/package*.json ./web/
RUN npm ci && cd web && npm ci

FROM node:krypton-alpine AS release

LABEL org.opencontainers.image.source = "https://github.com/WFCD/genesis"

WORKDIR /app/genesis
COPY --from=base /app/genesis/node_modules ./node_modules
COPY --from=base /app/genesis/web/node_modules ./web/node_modules
COPY . .

WORKDIR /app/genesis/web
ENV SCOPE=WEB
ENV NODE_ENV=production
RUN npm run build

EXPOSE 3131
CMD ["npm", "run", "start"]
