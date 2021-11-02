'use strict';

const Command = require('../../models/Command.js');

/**
 * Sends the user an OAuth or other URL for inviting the bot (User configurable env: INVITE_URL)
 */
class Invitation extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'core.invitation', 'invitation', 'Send Invitation Link to Authorize Bot to Join a Server', 'BOT_MGMT');
    this.regex = new RegExp(`^${this.call}$`, 'ig');
  }

  async run(message, ctx) {
    await message.reply({ content: process.env.INVITE_URL || ctx.i18n`No Invite Set` });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Invitation;
