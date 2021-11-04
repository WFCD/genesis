'use strict';

const Command = require('../../models/Command.js');

class RevokePromocode extends Command {
  constructor(bot) {
    super(bot, 'promocode.code.revoke', 'glyphs revoke', 'Revoke a claimed or granted code.', 'CODES');
    this.regex = new RegExp(`^${this.call}\\s?(.*)?`, 'i');
    this.usages = [
      {
        description: 'Revoke a claimed promocode from a user',
        parameters: ['code to revoke'],
      },
    ];
    this.requiresAuth = true;
    this.allowDM = true;
  }

  async run(message) {
    const code = message.strippedContent.match(this.regex)[1] || 0;

    if (typeof code === 'undefined') {
      await message.reply({ content: 'No code provided to revoke.' });
      return this.constructor.statuses.FAILURE;
    }
    // eslint-disable-next-line camelcase
    const [{ pool_id }] = await this.settings.getCode(code);
    // eslint-disable-next-line camelcase
    if (pool_id && await this.settings.userManagesPool(message.author, pool_id)) {
      await this.settings.revokeCode(code, pool_id);
      await message.reply({ content: 'Code Revoked.' });
      return this.constructor.statuses.SUCCESS;
    }
    await message.reply({ content: 'You need to manage the pool that this code is part of, or provide a valid code.' });
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = RevokePromocode;
