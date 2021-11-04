'use strict';

// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');

/**
 * Change channel visibility
 */
class Show extends require('../../models/Command.js') {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'rooms.lurk', 'lurk', 'Make room lurkable. Users can join, see, and listen, but not write.', 'ROOMS');
    this.regex = new RegExp(`^${this.call}$`, 'i');
    this.usages = [];
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Discord.Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {CommandContext} ctx Command context for calling commands
   * @returns {string} success status
   */
  async run(message, ctx) {
    if (ctx.createPrivateChannel) {
      const userHasRoom = await ctx.settings.userHasRoom(message.member);
      if (userHasRoom) {
        const room = await ctx.settings.getUsersRoom(message.member);
        const { everyone } = message.guild.roles;
        const options = {
          VIEW_CHANNEL: true, CONNECT: true, SPEAK: false, SEND_MESSAGES: false,
        };
        const audit = {
          reason: `Room made lurkable by ${message.author.tag}`,
        };
        try {
          if (room.category) {
            await room.category.permissionOverwrites.edit(everyone, options, audit);
          }
          if (room.textChannel) {
            await room.textChannel.permissionOverwrites.edit(everyone, options, audit);
          }
          await room.voiceChannel.permissionOverwrites.edit(everyone, options, audit);
          return this.messageManager.statuses.SUCCESS;
        } catch (e) {
          this.logger.error(e);
          await message.reply({ content: 'unable to make the channel visible. Please either try again or review your command to ensure it is valid.' });
          return this.messageManager.statuses.FAILURE;
        }
      }
      await message.reply({ content: `you haven't created a channel. Only the creator of a channel can change the status of a channel.\nUse \`${ctx.prefix}create\` to view channel creation syntax.` });
      return this.messageManager.statuses.FAILURE;
    }
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Show;
