'use strict';

const Command = require('../../models/Command.js');
const { resolvePool } = require('../../CommonFunctions');

class RemovePool extends Command {
  constructor(bot) {
    super(bot, 'promocode.pools.remove', 'glyphs del pool', 'Remove a glyph pool', 'CODES');
    this.regex = new RegExp(`^${this.call}\\s?(.*)?`, 'i');
    this.usages = [
      {
        description: 'Remove a glyph pool that you manage',
        parameters: ['--pool <pool id>*'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    let pool = message.strippedContent.match(this.regex)[1] || '';
    pool = await resolvePool(message, this.settings, { explicitOnly: true, pool });
    if (typeof pool === 'undefined') {
      await message.reply({ content: 'You either manage none or too many pools. Please specify the pool ID.' });
      return this.messageManager.statuses.FAILURE;
    }
    await this.settings.deletePool(pool);
    await message.reply({ content: `Deleted pool \`${pool}\`.` });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = RemovePool;
