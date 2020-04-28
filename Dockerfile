FROM node:lts-alpine as base

RUN apk --no-cache add git python3 make gcc musl-dev g++ bash && mkdir -p /app/genesis
WORKDIR /app/genesis
COPY package*.json ./
RUN npm install --production

FROM node:lts-alpine as release

COPY --from=base --chown=node:node /app/genesis /app/genesis
WORKDIR /app/genesis
COPY --chown=node:node . .

## Add the wait script to the image
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait

USER node
CMD /wait && node main.js
