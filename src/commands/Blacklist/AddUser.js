'use strict';

const Command = require('../../models/Command.js');

/**
 * Sets the current guild's custom prefix
 */
class AddUser extends Command {
  constructor(bot) {
    super(bot, 'core.blacklist.add', 'bl add', 'Add a user to the blacklist');
    this.requiresAuth = true;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx     Message/command context
   * @returns {string} success status
   */
  async run(message, ctx) {
    const all = /--all/ig.test(message.strippedContent) && ctx.isOwner;
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = AddUser;
