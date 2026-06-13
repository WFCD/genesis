import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import decache from 'decache';
import { Events } from 'discord.js';

import BaseEventHandler from '../models/BaseEventHandler';
import type Genesis from '../bot';

const handlersDir = path.dirname(fileURLToPath(import.meta.url));

const handlerFile = /EventHandler\.(js|ts)$/;
const map = /.*\.(js|ts).map$/;

export interface HandlerEventPayload {
  event: string;
  args: unknown[];
}

export default class EventHandler {
  bot: Genesis;

  logger: Genesis['logger'];

  client: Genesis['client'];

  handlers: BaseEventHandler[] = [];

  constructor(bot: Genesis) {
    this.bot = bot;
    this.logger = bot.logger;
    this.client = bot.client;
  }

  async loadHandles() {
    let files = await fs.readdir(handlersDir);

    const categories = files.filter((f) => !/\.(js|ts)$/.test(f) && !map.test(f));
    files = files.filter((f) => /\.(js|ts)$/.test(f) && !handlerFile.test(f));

    await Promise.all(
      categories.map(async (category) => {
        files = files.concat((await fs.readdir(path.join(handlersDir, category))).map((f) => path.join(category, f)));
      })
    );

    if (this.handlers.length !== 0) {
      this.logger.silly('Decaching handles');
      files.forEach((f) => {
        decache(path.join(handlersDir, f));
      });
    }

    this.logger.info('Loading handles');
    this.logger.debug(`${files}`);

    this.handlers = (
      await Promise.all(
        files.map(async (f) => {
          try {
            const Handler = (await import(path.join(handlersDir, f))).default;
            if (Handler.prototype instanceof BaseEventHandler) {
              if (Handler.deferred) {
                this.client.on(Events.ClientReady, () => {
                  const handler = new Handler(this.bot);
                  this.handlers.push(handler);
                });
              } else {
                const handler = new Handler(this.bot);

                this.logger.silly(`Adding ${handler.id}`);
                return handler;
              }
            }
            return undefined;
          } catch (err) {
            this.logger.error(err);
            return undefined;
          }
        })
      )
    ).filter((c): c is BaseEventHandler => Boolean(c));
  }

  async handleEvent({ event, args }: HandlerEventPayload) {
    return Promise.all(
      this.handlers.filter((handler) => handler.event === event).map(async (handler) => handler.execute(...args))
    );
  }
}
