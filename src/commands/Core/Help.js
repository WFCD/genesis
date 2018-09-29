'use strict';

const Command = require('../../models/Command.js');
const { createGroupedArray, createPageCollector } = require('../../CommonFunctions');

const invalidResultsEmbed = {
  color: 0x00CCFF,
  title: 'No results, please refine query.',
};

const createEmbedsForCommands = (commandFields, title, color) => ({
  title,
  fields: [].concat(...commandFields),
  color,
  type: 'rich',
  footer: {
    text: '* Denotes Optionional Parameters',
    icon_url: 'https://warframestat.us/wfcd_logo_color.png',
  },
});

const mapCommands = (commands, prefix) => commands.map(command => command.usages.map(u => ({
  name: `${command.isInline ? '' : prefix}${command.call} ${u.parameters.map(p => `${u.delimBefore || '<'}${p}${u.delimAfter || '>'}`.trim()).join(u.separator || ' ')}`,
  value: u.description || 'No description',
  inline: false,
})));

const commandSort = (a, b) => {
  if (a.call < b.call) {
    return -1;
  }
  if (a.call > b.call) {
    return 1;
  }
  return 0;
};

/**
 * Describes the Help command
 */
class Help extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'core.help', 'help', 'Display this message');

    this.helpEmbed = null;

    this.regex = new RegExp(`^${this.call}(?:\\s(.*)?)?$`, 'i');

    this.usages = [
      {
        description: 'Receive the full welcome data by visiting the provided link.',
        parameters: [],
      },
      {
        description: 'Query for info about a specific command',
        parameters: ['command search'],
      },
    ];

    /**
     * Help reply messsage for alerting a user to check their direct messages.
     * @type {string}
     * @private
     */
    this.helpReplyMsg = process.env.HELP_REPLY || ' check your direct messages for help.';
  }

  /**
   * Send help message
   * @param {Message} message Message to reply to
   * @returns{boolean} success status
   */
  async run(message) {
    let query = message.strippedContent.match(this.regex)[1];

    const config = {
      prefix: await this.settings.getGuildSetting(message.guild, 'prefix'),
      isOwner: message.author.id === this.bot.owner,
      hasAuth: message.channel.type === 'dm' || message.channel
        .permissionsFor(message.author)
        .has('MANAGE_ROLES'),
    };

    const searchableCommands = this.bot.commandManager.commands.filter((command) => {
      if ((command.ownerOnly && !config.isOwner) || (command.requiresAuth && !config.hasAuth)) {
        return false;
      }
      return true;
    });

    if (query) {
      query = String(query).toLowerCase();

      // filter commands
      const matchingCommands = searchableCommands.filter((command) => {
        if (query.length < 3) {
          return false;
        }
        return command.call.toLowerCase().includes(query)
          || command.id.toLowerCase().includes(query)
          || command.usages.filter((usage) => {
            const descIncluded = usage.description
              ? usage.description.toLowerCase().includes(query) : false;
            const paramIncluded = usage.parameters.join(' ').toLowerCase().includes(query);
            return descIncluded || paramIncluded;
          }).length > 0;
      });

      if (matchingCommands.length < 1) {
        await this.messageManager.embed(message, invalidResultsEmbed, false);
        return this.messageManager.statuses.FAILURE;
      }
      matchingCommands.sort(commandSort);

      const lines = mapCommands(matchingCommands, config.prefix);
      const groups = createGroupedArray(lines, 9);
      const embeds = groups.map(group => createEmbedsForCommands(group, 'Help!', 0x4068BD));
      const msg = await this.messageManager.embed(message, embeds[0], false, false);
      await createPageCollector(msg, embeds, message.author);
      return this.messageManager.statuses.SUCCESS;
    }
    searchableCommands.sort(commandSort);
    const lines = mapCommands(searchableCommands, config.prefix);
    const groups = createGroupedArray(lines, 9);
    const embeds = groups.map(group => createEmbedsForCommands(group, 'Help!', 0x4068BD));
    const msg = await this.messageManager.embed(message, embeds[0], false, false);
    await createPageCollector(msg, embeds, message.author);
    return this.messageManager.statuses.SUCCESS;
  }

  async sendEmbedForCommands(message, commands, title, color) {
    const embed = createEmbedsForCommands(commands, title, color);
    if (commands.length > 0) {
      await this.messageManager.embed(message, embed, true, false);
    }
  }
}

module.exports = Help;
