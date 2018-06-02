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
    text: commandFields.length === 10 ? 'Search results limited to 10. If you believe more are available, please refine your search.' : undefined,
    icon_url: 'https://warframestat.us/wfcd_logo_color.png',
  },
});

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
        .has('MANAGE_ROLES_OR_PERMISSIONS'),
    };

    const searchableCommands = this.commandHandler.commands.filter((command) => {
      if ((command.ownerOnly && !config.isOwner) || (command.requiresAuth && !config.hasAuth)) {
        return false;
      }
      return true;
    });

    if (query) {
      query = query.toLowerCase();
      if (message.channel.type !== 'dm') {
        await this.messageManager.reply(message, this.helpReplyMsg, true, true);
      }

      // filter commands
      let matchingCommands = searchableCommands.filter((command) => {
        if (query.length < 3) {
          return false;
        }
        return command.call.toLowerCase().includes(query)
          || command.id.toLowerCase().includes(query)
          || command.usages.filter(usage =>
            (usage.description ? usage.description.toLowerCase().includes(query) : false)
          || usage.parameters.join(' ').toLowerCase().includes(query)).length > 0;
      });

      if (matchingCommands.length < 1) {
        await this.messageManager.sendDirectEmbedToAuthor(message, invalidResultsEmbed, false);
        return this.messageManager.statuses.FAILURE;
      }
      matchingCommands = matchingCommands.slice(0, 10);
      await this.sendEmbedForCommands(message, matchingCommands, 'Help!', 0x4068BD);
      return this.messageManager.statuses.SUCCESS;
    }
    const lines = searchableCommands.map(command => command.usages.map(u => ({
      name: `${config.prefix}${command.call} ${u.parameters.map(p => `<${p}>`).join(u.separator ? u.separator : ' ')}`,
      value: u.description,
      inline: false,
    })));
    const groups = createGroupedArray(lines, 5);
    const embeds = groups.map(group => createEmbedsForCommands(group, 'Help!', 0x4068BD));
    const msg = await this.messageManager.embed(message, embeds[0], false, false);
    await createGroupedArray(msg, embeds, message.author);
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
