'use strict';

const Discord = require('discord.js');

const BaseEmbed = require('../../embeds/BaseEmbed');
const Command = require('../../models/Command');
const {
  createGroupedArray, setupPages, games, assetBase,
} = require('../../CommonFunctions');

const { Permissions } = Discord;

const invalidResultsEmbed = {
  color: 0x00CCFF,
  title: 'No results, please refine query.',
};

const createEmbedsForCommands = (commandFields, title, color, query) => {
  const embed = new BaseEmbed();
  embed.title = title;
  embed.fields = [].concat(...commandFields);
  embed.color = color;
  embed.footer.text = '*Optional Parameter • <> Parameter Replacements';

  const call = embed.fields.length === 1 ? embed.fields[0].call : query;
  embed.image = {
    url: `${assetBase}/gif/help/${call}.gif`,
  };
  return embed;
};

const mapCommands = (commands, prefix, i18n) => commands.map(command => command.usages.map(u => ({
  name: `${command.isInline ? '' : prefix}${command.call} ${u.parameters.map(p => `${u.delimBefore || '<'}${p}${u.delimAfter || '>'}`.trim()).join(u.separator || ' ')}`,
  value: u.description || i18n`No description`,
  inline: false,
  call: command.call,
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
    super(bot, 'core.help', 'help', 'Display this message', 'CORE');

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

  async run(message, ctx) {
    let query = message.strippedContent.match(this.regex)[1];

    const config = {
      prefix: await this.settings.getGuildSetting(message.guild, 'prefix'),
      isOwner: message.author.id === this.bot.owner,
      hasAuth: message.channel.type === 'DM' || message.channel
        .permissionsFor(message.author)
        .has(Permissions.FLAGS.MANAGE_ROLES),
    };

    let searchableCommands = [];
    for (const command of this.bot.commandManager.commands) {
      const canAct = this.checkCanAct(command, message);

      if ((canAct === '1' || canAct === 'none' || canAct !== '0') && canAct) {
        searchableCommands.push(command);
      }
    }

    if (query) {
      query = String(query).toLowerCase();

      // filter commands
      searchableCommands = searchableCommands.filter((command) => {
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

      if (searchableCommands.length < 1) {
        await this.messageManager.embed(message, invalidResultsEmbed, false);
        return this.messageManager.statuses.FAILURE;
      }
    }
    searchableCommands.sort(commandSort);
    const lines = mapCommands(searchableCommands, config.prefix, ctx.i18n);
    const groups = createGroupedArray(lines, 9);
    const embeds = groups.map(group => createEmbedsForCommands(group, ctx.i18n`Help!`, 0x4068BD, query));
    await setupPages(embeds, { message, settings: this.settings, mm: this.messageManager });
    return this.messageManager.statuses.SUCCESS;
  }

  /**
   * Check if the current command being called is able to be performed for the user calling it.
   * @param   {Command} command  command to process to see if it can be called
   * @param   {Discord.Message} message Discord message object
   * @returns {boolean} Whether or not the current command can be called by the author
   */
  checkCanAct(command, message) {
    if (!command.enabled) {
      return false;
    }
    if (command.ownerOnly && message.author.id !== this.bot.owner) {
      return false;
    }
    if (message.channel.type === 'GUILD_TEXT' && games.includes(command.game)) {
      return (command.requiresAuth && message.channel.permissionsFor(message.author)
        .has(Discord.Permissions.FLAGS.MANAGE_ROLES)) || !command.requiresAuth;
    }
    return message.channel.type === 'DM' && command.allowDM;
  }
}

module.exports = Help;
