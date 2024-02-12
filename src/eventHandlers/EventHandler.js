import fs from 'node:fs/promises';
import path from 'node:path';

import decache from 'decache';

import BaseEventHandler from '../models/BaseEventHandler.js';

/**
 * Describes a CommandHandler for a bot.
 */
export default class EventHandler {
  /**
   * Constructs CommandHandler
   * @param {Genesis} bot    Bot to derive prefix for commands from
   */
  constructor(bot) {
    this.bot = bot;
    this.logger = bot.logger;

    this.client = bot.client;

    /**
     * Array of command objects that can be called
     * @type {Array<BaseEventHandler>}
     * @private
     */
    this.handlers = [];
  }

  /**
   * Loads the handles from disk into this.handles
   */
  async loadHandles() {
    const handlersDir = path.join(path.resolve('src/eventHandlers'));
    let files = await fs.readdir(handlersDir);

    const categories = files.filter((f) => f.indexOf('.js') === -1 && !f.startsWith('EventHandler'));
    files = files.filter((f) => f.indexOf('.js') > -1);

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
            // eslint-disable-next-line import/no-dynamic-require, global-require
            const Handler = (await import(path.join(handlersDir, f))).default;
            if (Handler.prototype instanceof BaseEventHandler) {
              if (Handler.deferred) {
                this.client.on('ready', () => {
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
    ).filter((c) => c);
  }

  /**
   * Handle the command contained in the message contents, if any.
   * @param {Object} args arguments for handlers
   * @returns {Promise} resolution of handlers execution
   */
  async handleEvent(args) {
    return Promise.all(
      this.handlers
        .filter((handler) => handler.event === args.event)
        .map(async (handler) => handler.execute(...args.args))
    );
  }
}
