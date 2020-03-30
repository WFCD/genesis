'use strict';

const Command = require('../../models/Command.js');
const { captures: { channel: cc, role: rc } } = require('../../CommonFunctions');

class TrackRole extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'settings.roles.track', 'r track', 'Track a role in a server', 'UTIL');
    this.requiresAuth = true;
    this.allowDM = false;
    this.regex = new RegExp(`^${this.call} ${cc} ${rc}`, 'i');
    this.usages = [
      {
        description: 'Add a new channel <-> role stats binding',
        parameters: ['channel', 'role'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    const { guild } = message;
    const channelId = (message.strippedContent.match(cc) || [])[0]
      .replace('<#', '')
      .replace('>', '');

    if (!channelId) return this.messageManager.statuses.FAILURE;
    const channel = guild.channels.get(channelId);
    if (!channel) return this.messageManager.statuses.FAILURE;

    const roleId = (message.strippedContent.replace(channelId, '')
      .match(rc) || [])[0]
      .replace('<@&', '')
      .replace('>', '');

    if (!roleId) return this.messageManager.statuses.FAILURE;
    const role = guild.roles.cache.get(roleId);
    if (!role) return this.messageManager.statuses.FAILURE;

    await this.settings.trackRole(guild, channel, role);
    this.messageManager.notifySettingsChange(message, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = TrackRole;
