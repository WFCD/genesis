'use strict';

const Command = require('../../models/Command.js');
const { resolvePool } = require('../../CommonFunctions');

class SetPoolPublic extends Command {
  constructor(bot) {
    super(bot, 'promocode.pool.public', 'glyphs public', 'Make a pool public or private', 'CODES');
    this.regex = new RegExp(`^${this.call}\\s?(on|off)?\\s*(?:--pool\\s?(.*))?`, 'i');
    this.usages = [
      {
        description: 'Make a pool public or private',
        parameters: ['<on | off>', '--pool <pool id>*'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message, ctx) {
    let enable = message.strippedContent.match(this.regex)[1];
    if (!enable) {
      return this.sendToggleUsage(message, ctx);
    }
    enable = enable.trim();

    const pool = await resolvePool(message, this.settings);

    if (typeof pool === 'undefined') {
      await message.reply({ content: 'You either manage none or too many pools. Please specify the pool ID.' });
      return this.constructor.statuses.FAILURE;
    }
    await this.settings.setPoolPublic(pool, enable === 'on');
    await message.reply({ content: 'Pool publicity set.' });
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = SetPoolPublic;
