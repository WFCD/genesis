'use strict';

const Command = require('../../models/Command.js');
const { createGroupedArray, setupPages } = require('../../CommonFunctions');

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

    const searchableCommands = [];
    for (const command of this.bot.commandManager.commands) {
      const canAct = await this.checkCanAct(command, message);

      if (canAct === '1' || canAct === 'none') {
        this.logger.debug(`${command.id} ${canAct}`);
        searchableCommands.push(command);
      }
    }

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
      await setupPages(embeds, { message, settings: this.settings, mm: this.messageManager });
      return this.messageManager.statuses.SUCCESS;
    }
    searchableCommands.sort(commandSort);
    const lines = mapCommands(searchableCommands, config.prefix);
    const groups = createGroupedArray(lines, 9);
    const embeds = groups.map(group => createEmbedsForCommands(group, 'Help!', 0x4068BD));
    await setupPages(embeds, { message, settings: this.settings, mm: this.messageManager });
    return this.messageManager.statuses.SUCCESS;
  }

  async sendEmbedForCommands(message, commands, title, color) {
    const embed = createEmbedsForCommands(commands, title, color);
    if (commands.length > 0) {
      await this.messageManager.embed(message, embed, true, false);
    }
  }

  /**
   * Check if the current command being called is able to be performed for the user calling it.
   * **COPIED FROM CommandHandler.js**
   * @param   {Command} command  command to process to see if it can be called
   * @param   {Message} message Discord message object
   * @param   {boolean} allowCustom Whether or not to allow custom commands
   * @param   {boolean} allowInline Whether or not to allow inline commands
   * @returns {Promise<boolean>} Whether or not the current command can be called by the author
   */
  async checkCanAct(command, message) {
    if (!command.enabled) {
      return false;
    }
    if (command.ownerOnly && message.author.id !== this.bot.owner) {
      return false;
    }
    if (message.channel.type === 'text') {
      if (command.requiresAuth) {
        if (message.channel.permissionsFor(message.author).has('MANAGE_ROLES')) {
          const memberHasPermForRequiredAuthCommand = await this.bot.settings
            .getChannelPermissionForMember(message.channel, message.author.id, command.id);
          if (memberHasPermForRequiredAuthCommand === 'none') {
            const roleHasPermForRequiredAuthCommand = await this.bot.settings
              .getChannelPermissionForUserRoles(
                message.channel,
                message.author.id, command.id,
              );
            return roleHasPermForRequiredAuthCommand;
          }
          return memberHasPermForRequiredAuthCommand;
        }
        return false;
      }
      const memberHasPermForNonAuthCommand = await this.bot.settings
        .getChannelPermissionForMember(message.channel, message.author.id, command.id);
      if (memberHasPermForNonAuthCommand === 'none') {
        const roleHasPermForNonAuthCommand = await this.bot.settings
          .getChannelPermissionForUserRoles(message.channel, message.author, command.id);
        return roleHasPermForNonAuthCommand;
      }
      return memberHasPermForNonAuthCommand;
    }
    if (message.channel.type === 'dm' && command.allowDM) {
      return true;
    }
    return false;
  }
}

module.exports = Help;
