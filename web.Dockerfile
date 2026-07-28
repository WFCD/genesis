FROM node:krypton-alpine AS base

# Next.js Alpine needs this; ignore-scripts avoids SIGILL (exit 132) from native
# postinstalls (sharp/esbuild) when buildx emulates linux/arm64 via QEMU.
RUN apk add --no-cache libc6-compat
WORKDIR /app/genesis
COPY package.json package-lock.json ./
COPY packages/bot/package.json ./packages/bot/
COPY packages/worker/package.json ./packages/worker/
COPY packages/shared/package.json ./packages/shared/
COPY packages/web/package.json ./packages/web/
# Ensure package node_modules dirs exist so release-stage COPY always works
# (npm may hoist everything to the root, or nest workspace deps under packages/*).
# Lockfiles generated on macOS often omit linux musl optional natives
# (lightningcss, @tailwindcss/oxide); install Alpine-matching packages so
# Next/Tailwind CSS can load.
RUN npm ci --ignore-scripts --include-workspace-root -w @genesis/web \
  && ARCH="$(node -p "process.arch === 'x64' ? 'x64' : process.arch")" \
  && LCSS_VER="$(node -e "console.log(JSON.parse(require('node:fs').readFileSync('node_modules/lightningcss/package.json','utf8')).version)")" \
  && OXIDE_VER="$(node -e "console.log(JSON.parse(require('node:fs').readFileSync('node_modules/@tailwindcss/oxide/package.json','utf8')).version)")" \
  && npm install --no-save --ignore-scripts \
       "lightningcss-linux-${ARCH}-musl@${LCSS_VER}" \
       "@tailwindcss/oxide-linux-${ARCH}-musl@${OXIDE_VER}" \
  && mkdir -p packages/web/node_modules packages/shared/node_modules

FROM node:krypton-alpine AS release

LABEL org.opencontainers.image.source="https://github.com/WFCD/genesis"

RUN apk add --no-cache libc6-compat
WORKDIR /app/genesis
COPY . .
COPY --from=base /app/genesis/node_modules ./node_modules
COPY --from=base /app/genesis/packages/web/node_modules ./packages/web/node_modules
COPY --from=base /app/genesis/packages/shared/node_modules ./packages/shared/node_modules

ENV SCOPE=WEB
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Auth.js requires a secret at build time for production; runtime compose overrides.
ENV AUTH_SECRET=build-time-placeholder
RUN npm run build -w @genesis/web

WORKDIR /app/genesis/packages/web
EXPOSE 3131
CMD ["npm", "run", "start"]
