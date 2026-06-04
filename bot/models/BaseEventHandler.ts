import type { Client } from 'discord.js';

import type { Database } from '#shared/types/database';
import type { Logger } from '#shared/types/logger';

import type Genesis from '../bot';

export default class BaseEventHandler {
  static deferred = false;

  id: string;

  logger: Logger;

  bot: Genesis;

  event: string;

  settings: Database;

  client: Client;

  constructor(bot: Genesis, id: string, event: string) {
    this.id = id;
    this.logger = bot.logger;
    this.bot = bot;
    this.event = event;
    this.settings = bot.settings;
    this.client = bot.client;
  }

  async execute(..._args: unknown[]): Promise<unknown> {
    this.logger.debug(`Handled ${_args[0]}`);
    return undefined;
  }
}
