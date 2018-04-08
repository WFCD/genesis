'use strict';

const Command = require('../../models/Command.js');

/**
 * Resize temp channel
 */
class Lock extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'rooms.lock', 'lock', 'Lock temp room');
    this.regex = new RegExp(`^${this.call}$`, 'i');
    this.usages = [];
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {Object} ctx Command context for calling commands
   * @returns {string} success status
   */
  async run(message, ctx) {
    if (ctx.createPrivateChannel) {
      const userHasRoom = await this.settings.userHasRoom(message.member);
      if (userHasRoom) {
        const room = await this.settings.getUsersRoom(message.member);
        try {
          if (room.category) {
            await room.category.overwritePermissions(message.guild.defaultRole.id, {
              CONNECT: false,
            });
          }
          if (room.textChannel) {
            await room.textChannel.overwritePermissions(message.guild.defaultRole.id, {
              CONNECT: false,
            });
          }
          await room.voiceChannel.overwritePermissions(message.guild.defaultRole.id, {
            CONNECT: false,
          });
          return this.messageManager.statuses.SUCCESS;
        } catch (e) {
          this.logger.error(e);
          await this.messageManager.reply(message, 'unable to lock the channel. Please either try again or review your command to ensure it is valid.', true, true);
          return this.messageManager.statuses.FAILURE;
        }
      }
      await this.messageManager.reply(message, `you haven't created a channel. Only the creator of a channel can change the status of a channel.\nUse \`${ctx.prefix}create\` to view channel creation syntax.`, true, true);
      return this.messageManager.statuses.FAILURE;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Lock;
