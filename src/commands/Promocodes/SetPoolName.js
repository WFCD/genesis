'use strict';

const Command = require('../../models/Command.js');
const { resolvePool } = require('../../CommonFunctions');

class SetPoolGuild extends Command {
  constructor(bot) {
    super(bot, 'promocode.pool.name', 'glyphs set name', 'Set a pool\'s name', 'CODES');
    this.regex = new RegExp(`^${this.call}\\s?(?:--pool\\s?(?:.*))?(.*)?`, 'i');
    this.usages = [
      {
        description: 'Set a pool\'s name. This doesn\'t alter the pool Id.',
        parameters: ['--pool <pool id>*', '<new pool name>'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const name = message.strippedContent.match(this.regex)[1] || 0;
    const pool = await resolvePool(message, this.settings);
    if (typeof pool === 'undefined') {
      await message.reply({ content: 'You either manage none or too many pools. Please specify the pool ID.' });
      return this.constructor.statuses.FAILURE;
    }
    if (name) {
      await this.settings.setPoolName(pool, name);
      return this.constructor.statuses.SUCCESS;
    }
    await message.reply({ content: 'Please specify a name.' });
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = SetPoolGuild;
