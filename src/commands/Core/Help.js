'use strict';

const Command = require('../../Command.js');


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
    if (message.channel.type !== 'dm') {
      this.messageManager.reply(message, this.helpReplyMsg, true, false);
    }
    const prefix = await this.bot.settings.getChannelSetting(message.channel, 'prefix');
    this.sendCoreEmbed(message, prefix);
    if (message.channel.type === 'dm' ||
       message.channel
        .permissionsFor(message.author)
        .has('MANAGE_ROLES_OR_PERMISSIONS')) {
      this.sendSettingsEmbed(message, prefix);
    }
    this.sendWorldStateEmbed(message, prefix);
    this.sendWarframeEmbed(message, prefix);
    this.sendHelpEmbed(message, prefix);
    if (message.author.id === this.bot.owner) {
      this.sendOwnerOnlyEmbed(message, prefix);
    }
    return this.messageManager.statuses.SUCCESS;
  }

  sendHelpEmbed(message, prefix) {
    const commands = this.commandHandler.commands.filter(c =>
        !c.ownerOnly &&
        !/core/ig.test(c.id) &&
        !(/warframe/ig.test(c.id)) &&
        !/settings/ig.test(c.id))
        .map(c => c.usages.map(u => ({
          name: `${prefix}${c.call} ${u.parameters.map(p => `<${p}>`).join(u.separator ? u.separator : ' ')}`,
          value: u.description,
          inline: false,
        }
      )));
    this.sendEmbedForCommands(message, commands, 'Help!', 0x00ff00);
  }

  sendOwnerOnlyEmbed(message, prefix) {
    const ownerCommands = this.commandHandler.commands.filter(c => c.ownerOnly)
        .map(c => c.usages.map(u => ({
          name: `${prefix}${c.call} ${u.parameters.map(p => `<${p}>`).join(u.separator ? u.separator : ' ')}`,
          value: u.description,
          inline: false,
        })));
    this.sendEmbedForCommands(message, ownerCommands, 'Owner Only', 0xff0000);
  }

  sendCoreEmbed(message, prefix) {
    const commands = this.commandHandler.commands.filter(c => !c.ownerOnly && /core/ig.test(c.id))
        .map(c => c.usages.map(u => ({
          name: `${prefix}${c.call} ${u.parameters.map(p => `<${p}>`).join(u.separator ? u.separator : ' ')}`,
          value: u.description,
          inline: false,
        })));
    this.sendEmbedForCommands(message, commands, 'Core Commands', 0x000000);
  }

  sendWorldStateEmbed(message, prefix) {
    const commands = this.commandHandler.commands.filter(c => !c.ownerOnly && /warframe.worldstate/ig.test(c.id))
        .map(c => c.usages.map(u => ({
          name: `${prefix}${c.call} ${u.parameters.map(p => `<${p}>`).join(u.separator ? u.separator : ' ')}`,
          value: u.description,
          inline: false,
        })));
    this.sendEmbedForCommands(message, commands, 'Warframe Commands - Worldstate', 0x4068BD);
  }

  sendWarframeEmbed(message, prefix) {
    const commands = this.commandHandler.commands.filter(c => !c.ownerOnly && /warframe.(?!worldstate)/ig.test(c.id))
        .map(c => c.usages.map(u => ({
          name: `${prefix}${c.call} ${u.parameters.map(p => `<${p}>`).join(u.separator ? u.separator : ' ')}`,
          value: u.description,
          inline: false,
        })));
    this.sendEmbedForCommands(message, commands, 'Warframe Commands - Utility', 0x4068BD);
  }

  sendSettingsEmbed(message, prefix) {
    const ownerCommands = this.commandHandler.commands.filter(c => !c.ownerOnly && /settings/ig.test(c.id))
      .map(c => c.usages.map(u => ({
        name: `${prefix}${c.call} ${u.parameters.map(p => `<${p}>`).join(u.separator ? u.separator : ' ')}`,
        value: u.description,
        inline: false,
      })));
    this.sendEmbedForCommands(message, ownerCommands, 'Settings Commands', 0xe5c100);
  }

  sendEmbedForCommands(message, commands, title, color) {
    const embed = {
      title,
      fields: [].concat(...commands),
      color,
    };
    if (title === 'Core Commands') {
      embed.type = 'rich';
      embed.thumbnail = {
        url: 'https://github.com/aliasfalse/genesis/raw/master/src/resources/cephalontransparent.png',
      };
    }
    if (commands.length > 0) {
      this.messageManager.sendDirectEmbedToAuthor(message, embed, false);
    }
  }
}

module.exports = Help;
