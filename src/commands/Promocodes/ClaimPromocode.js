'use strict';

const Command = require('../../models/Command.js');
const { resolvePool } = require('../../CommonFunctions');

class ClaimPromocode extends Command {
  constructor(bot) {
    super(bot, 'promocode.code.claim', 'glyphs claim', 'Claim a code.', 'CODES');
    this.regex = new RegExp(`^${this.call}\\s?(?:--pool\\s(.*))?\\s?(pc|ps4|xb1|switch)?\\s?(?:--password\\s(.*))?`, 'i');
    this.usages = [
      {
        description: 'Claim a code',
        parameters: ['--pool <pool id>*', '--password <pool password> (required if pool is secured)', '<platform>'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = true;
  }

  async run(message) {
    const pool = await resolvePool(message, this.settings, { checkRestriction: true });
    const platform = (message.strippedContent.match(/(pc|ps4|xb1|switch)/i) || [])[0] || 'pc';
    const userPassword = (message.strippedContent.match(/(?:--pass(?:word)\s?(.*))/i) || [])[0] || undefined;
    if (!pool) {
      await message.reply({ content: 'The pool is either restricted to another guild, or you need to specify one.' });
      return this.constructor.statuses.FAILURE;
    }
    const res = await this.settings.getNextCodeInPool(platform, pool);
    this.logger.error(JSON.stringify(res));
    const [{ code, grantedTo, password }] = res;
    if (typeof code === 'undefined') {
      await message.reply({ content: 'No more codes are available, contact your code provider or the owner of the pool to add more.' });
      return this.constructor.statuses.FAILURE;
    }
    const passMatch = password === null || userPassword === password;
    if (!(passMatch || await this.settings.isPoolPublic(pool))) {
      await message.reply({ content: 'Your password is invalid, or you didn\'t provide one and the pool is not open.' });
      return this.constructor.statuses.FAILURE;
    }
    if (await this.settings.hasCodeInPool(message.author, pool)) {
      await message.reply({ content: `<@${message.author.id}> already has a code from ` });
      return this.constructor.statuses.FAILURE;
    }
    if (grantedTo === null) {
      await this.settings.grantCode(code, message.author.id, message.author.id, platform);
      await message.reply({ content: `Code claimed by <@${message.author.id}>` });
      return this.constructor.statuses.SUCCESS;
    }
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = ClaimPromocode;
