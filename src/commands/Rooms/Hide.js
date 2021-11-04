'use strict';

// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
const { Permissions } = require('discord.js');

/**
 * Change channel visibility
 */
class Hide extends require('../../models/Command.js') {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'rooms.hide', 'hide', 'Hide temp room', 'ROOMS');
    this.regex = new RegExp(`^${this.call}$`, 'i');
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
        const { everyone } = message.guild.roles;
        const connect = room.voiceChannel.permissionsFor(everyone).has(Permissions.FLAGS.CONNECT);
        const options = { VIEW_CHANNEL: false, CONNECT: connect };
        /** @type {Discord.GuildChannelOverwriteOptions}  */
        const audit = { reason: `Room hidden by ${message.author.tag}` };
        try {
          if (room?.category?.manageable) {
            await room.category.permissionOverwrites.edit(everyone, options, audit);
          }
          if (room?.textChannel?.manageable) {
            await room.textChannel.permissionOverwrites.edit(everyone, options, audit);
          }
          if (room?.voiceChannel?.manageable) {
            await room.voiceChannel.permissionOverwrites.edit(everyone, options, audit);
          }
          return this.constructor.statuses.SUCCESS;
        } catch (e) {
          this.logger.error(e);
          await message.reply('unable to make the channel visible. Please either try again or review your command to ensure it is valid.');
          return this.constructor.statuses.FAILURE;
        }
      }
      await message.reply(`you haven't created a channel. Only the creator of a channel can change the status of a channel.\nUse \`${ctx.prefix}create\` to view channel creation syntax.`);
      return this.constructor.statuses.FAILURE;
    }
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = Hide;
