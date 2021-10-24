'use strict';

// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');

/**
 * Resize temp channel
 */
module.exports = class Resize extends require('../../models/Command.js') {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'rooms.resize', 'resize room', 'Resize temp room', 'ROOMS');
    this.regex = new RegExp(`^${this.call}\\s?(\\d+)`, 'i');
    this.usages = [];
    this.allowDM = false;
  }

  /**
   * Run the command
   * @param {Discord.Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @param {CommandContext} ctx Command context for calling commands
   * @returns {Promise<string>} success status
   */
  async run(message, ctx) {
    if (ctx.createPrivateChannel) {
      const userHasRoom = await ctx.settings.userHasRoom(message.member);
      if (userHasRoom) {
        const room = await ctx.settings.getUsersRoom(message.member);
        const newSize = parseInt(message.strippedContent.replace(this.call, '').trim(), 10);
        try {
          if (newSize && newSize < 100) {
            await room.voiceChannel.setUserLimit(newSize);
            return this.messageManager.statuses.SUCCESS;
          }
          throw new Error('Illegal room size');
        } catch (e) {
          this.logger.error(e);
          await message.reply('unable to change channel\'s size. Please either try again or review your invitations to ensure they are valid users.');
          return this.messageManager.statuses.FAILURE;
        }
      }
      await message.reply(`you haven't created a channel. Only the creator of a channel can change the size of a channel.\nUse \`${ctx.prefix}create\` to view channel creation syntax.`);
      return this.messageManager.statuses.FAILURE;
    }
    return this.messageManager.statuses.FAILURE;
  }
};
