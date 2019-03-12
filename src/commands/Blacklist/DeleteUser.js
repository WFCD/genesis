'use strict';

const Command = require('../../models/Command.js');

const { captures: { user } } = require('../../CommonFunctions');

/**
 * Sets the current guild's custom prefix
 */
class DeleteUser extends Command {
  constructor(bot) {
    super(bot, 'core.blacklist.remove', 'bl remove', 'Remove a user from the blacklist');
    this.requiresAuth = true;
    this.regex = new RegExp(`^${this.call}\\s?${user}`);
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx     Message/command context
   * @returns {string} success status
   */
  async run(message, ctx) {
    const global = /--?g(?:lobal)?/ig.test(message.strippedContent) && ctx.isOwner;
    const userId = message.strippedContent.replace('--global', '').replace('-g', '').trim().match(new RegExp(user, 'i'))[1];

    if (userId && message.guild) {
      await this.settings.deleteBlacklistedUser(
        userId,
        message.guild ? message.guild.id : 0,
        global,
      );
      return this.messageManager.statuses.SUCCESS;
    }
    this.messageManager.reply(message, 'No such user.', true, true);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = DeleteUser;
