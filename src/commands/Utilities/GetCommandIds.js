'use strict';

const rpad = require('right-pad');
const Command = require('../../models/Command.js');
const CommandIdEmbed = require('../../embeds/CommandIdEmbed');
const { createGroupedArray, createPageCollector } = require('../../CommonFunctions');

/**
 * Get a list of all servers
 */
class GetCommandIds extends Command {
  /**
   * Constructs a callable command
   * @param {Bot} bot The bot object
   */
  constructor(bot) {
    super(bot, 'settings.getcommandids', 'getcommandids', 'Get list of bot command ids available for you to view');
    this.requiresAuth = true;
  }

  async run(message) {
    let commands = this.commandManager.commands
      .concat(this.commandManager.inlineCommands || [])
      .concat((this.commandManager.customCommands || [])
        .filter(cc => message.guild && cc.guildId === message.guild.id));
    const longestCall = commands.length ? commands.map(result => result.call).reduce((a, b) => (a.length > b.length ? a : b)) : '';
    const longestId = commands.length ? commands.map(result => result.id)
      .reduce((a, b) => (a.length > b.length ? a : b)) : '';

    commands = commands
      .filter(command => !command.ownerOnly
        || (message.author.id === this.bot.owner && command.ownerOnly))
      .map(command => `${rpad(command.call, longestCall.length, '\u2003')} `
        + `| ${rpad(command.id, longestId.length, '\u2003')} | ${command.blacklistable ? '✓' : '✗'}`);

    const pages = [];
    createGroupedArray(commands, 12).forEach((group) => {
      const embed = new CommandIdEmbed(this.bot, createGroupedArray(group, 4));
      pages.push(embed);
    });
    const msg = await this.messageManager.embed(message, pages[0], true, true);
    await createPageCollector(msg, pages, message.author);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = GetCommandIds;
