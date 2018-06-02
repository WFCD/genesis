'use strict';

const Command = require('../../models/Command.js');
const { resolvePool } = require('../../CommonFunctions');

class GrantPromocode extends Command {
  constructor(bot) {
    super(bot, 'promocode.code.grant', 'glyphs grant', 'Revoke a claimed or granted code.');
    this.regex = new RegExp(`^${this.call}\\s?(?:--pool\\s(.*))?\\s?(pc|ps4|xb1)?\\s?(?:<@([0-9]{0,20})>)?`, 'i');
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const pool = await resolvePool(message, this.settings);
    const platform = message.strippedContent.match(/(pc|ps4|xb1)/i)[0] || 'pc';
    const user = message.strippedContent.match(/([0-9]{16,20})/i)[0];
    if (!pool) {
      this.messageManager.reply(message, 'You can either not manage provided pool, or provided pool doesn\'t exist.');
      return this.messageManager.statuses.FAILURE;
    }
    if (!user || !this.bot.client.users.has(user)) {
      this.messageManager.reply(message, 'A user to grant to must be specified');
      return this.messageManager.statuses.FAILURE;
    }
    // eslint-disable-next-line camelcase
    const [{ code, grantedTo }] = await this.settings.getNextCodeInPool(platform, pool);
    if (typeof code === 'undefined') {
      this.messageManager.reply(message, 'No more codes are available, contact your code provider or the owner of the pool to add more.');
      return this.messageManager.statuses.FAILURE;
    }
    // eslint-disable-next-line camelcase
    if (grantedTo === null) {
      await this.settings.grantCode(code, user, message.author.id);
      this.messageManager.reply(message, `Code granted to <@${user}>`);
      return this.messageManager.statuses.SUCCESS;
    }
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = GrantPromocode;
