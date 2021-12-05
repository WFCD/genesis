'use strict';

const Command = require('../../models/Command.js');
const { resolvePool, captures } = require('../../CommonFunctions');

class GrantPromocode extends Command {
  constructor(bot) {
    super(bot, 'promocode.code.grant', 'glyphs grant', 'Grant a code.', 'CODES');
    this.regex = new RegExp(`^${this.call}\\s?(?:--pool\\s(.*))?\\s?${captures.platform}?\\s?${captures.user}?`, 'i');
    this.usages = [
      {
        description: 'Grant a code to a user from a specific pool',
        parameters: ['--pool <pool id>*', '<platform>', '<user mention or id>'],
        delimBefore: ' ',
        delimAfter: ' ',
      },
    ];
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message, ctx) {
    const pool = await resolvePool(message, this.settings);
    const platform = message.strippedContent.match(/(pc|ps4|xb1|switch)/i)[0] || 'pc';
    const user = message.strippedContent.match(/([0-9]{16,20})/i)[0];
    if (!pool) {
      await message.reply({ content: 'You can either not manage provided pool, or provided pool doesn\'t exist.' });
      return this.constructor.statuses.FAILURE;
    }
    if (!user || !this.bot.client.users.cache.has(user)) {
      await message.reply({ content: 'A user to grant to must be specified' });
      return this.constructor.statuses.FAILURE;
    }
    // eslint-disable-next-line camelcase
    const [{ code, grantedTo }] = await this.settings.getNextCodeInPool(platform, pool);
    if (typeof code === 'undefined') {
      await message.reply({ content: 'No more codes are available, contact your code provider or the owner of the pool to add more.' });
      return this.constructor.statuses.FAILURE;
    }
    // eslint-disable-next-line camelcase
    if (!grantedTo) {
      if (await this.settings.hasCodeInPool(message.author, pool)) {
        await message.reply({ content: `<@${message.author.id}> already has a code from ${pool}` });
        return this.constructor.statuses.FAILURE;
      }

      await this.settings.grantCode(code, user, message.author.id, platform);
      await message.reply({ content: `Code granted to <@${user}> from ${pool} on ${platform}` });
      await this.bot.client.users.cache.get(user).send({
        content: `You've been granted a code for ${pool} on ${platform}.
        \nUse \`${ctx.prefix}glyphs list claimed\` in this direct message to see your new code.
        \n**If you are receiving this in error, or the code is for the wrong platform,** contact ${message.member} immediately with the code so it can be revoked and a new code granted.`,
      });
      return this.constructor.statuses.SUCCESS;
    }
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = GrantPromocode;
