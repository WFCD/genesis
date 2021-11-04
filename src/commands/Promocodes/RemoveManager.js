'use strict';

const Command = require('../../models/Command.js');
const { resolvePool } = require('../../CommonFunctions');

class RemoveManager extends Command {
  constructor(bot) {
    super(bot, 'promocode.managers.remove', 'glyphs del manager', 'Remove a manager from a glyph pool', 'CODES');
    this.regex = new RegExp(`^${this.call}\\s?(?:--pool\\s?(.*))?\\s?(?:<@([0-9]{15,20})>)?`, 'i');
    this.usages = [
      {
        description: 'Remove a manager from a code pool',
        parameters: ['--pool <pool id>*', '<user mention or id>'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const user = message.strippedContent.match(/[0-9]{15,20}/i)[0] || 0;
    const pool = await resolvePool(message, this.settings);
    if (user === message.author.id) {
      await message.reply({ content: 'Tenno, you can\'t remove yourself!' });
      return this.constructor.statuses.FAILURE;
    }

    if (typeof pool === 'undefined') {
      await message.reply({ content: 'You either manage none or too many pools. Please specify the pool ID.' });
      return this.constructor.statuses.FAILURE;
    }
    if (this.bot.client.users.cache.has(user.trim())) {
      await this.settings.removePoolManager(pool, user.trim());
      return this.constructor.statuses.SUCCESS;
    }
    await message.reply({ content: 'Please specify a valid user ID or mention the user.' });
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = RemoveManager;
