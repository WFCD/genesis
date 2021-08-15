'use strict';

const Command = require('../../models/Command.js');

/**
 * Change channel visibility
 */
class Show extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'rooms.show', 'show', 'Show temp room', 'ROOMS');
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
        const { everyone } = message.guild.roles;
        const connect = room.voiceChannel.permissionsFor(everyone).has('CONNECT');
        const options = { VIEW_CHANNEL: true, CONNECT: connect };
        const audit = { reason: `Room shown by ${message.author.tag}` };
        try {
          if (room.category) {
            room.category.permissionOverwrites.edit(everyone, options, audit);
          }
          if (room.textChannel) {
            room.textChannel.permissionOverwrites.edit(everyone, options, audit);
          }
          await room.voiceChannel.permissionOverwrites.edit(everyone, options, audit);
          return this.messageManager.statuses.SUCCESS;
        } catch (e) {
          this.logger.error(e);
          await message.reply('unable to make the channel visible. Please either try again or review your command to ensure it is valid.');
          return this.messageManager.statuses.FAILURE;
        }
      }
      message.reply(`you haven't created a channel. Only the creator of a channel can change the status of a channel.\nUse \`${ctx.prefix}create\` to view channel creation syntax.`);
      return this.messageManager.statuses.FAILURE;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Show;
