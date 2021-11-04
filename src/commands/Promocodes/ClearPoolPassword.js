'use strict';

const Command = require('../../models/Command.js');
const { resolvePool } = require('../../CommonFunctions');

class ClearPoolPassword extends Command {
  constructor(bot) {
    super(bot, 'promocode.pool.clearpassword', 'glyphs clear password', 'Clear a pool\'s password', 'CODES');
    this.regex = new RegExp(`^${this.call}\\s?(?:--pool\\s(.*))?`, 'i');
    this.usages = [
      {
        description: 'Clear a pool\'s password',
        parameters: ['--pool <pool id>*'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const pool = await resolvePool(message, this.settings);
    if (typeof pool === 'undefined') {
      await message.reply({ content: 'You either manage none or too many pools. Please specify the pool ID.' });
      return this.constructor.statuses.FAILURE;
    }
    await this.settings.clearPoolPassword(pool);
    await message.reply({ content: 'Cleared.' });
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = ClearPoolPassword;
