'use strict';

const Command = require('../../Command.js');
const EnableUsageEmbed = require('../../embeds/EnableUsageEmbed.js');
const EnableInfoEmbed = require('../../embeds/EnableInfoEmbed.js');
const { getChannels, getTarget } = require('../../CommonFunctions');

class Disable extends Command {
  constructor(bot) {
    super(bot, 'settings.disable', 'disable', 'Disable a command.');
    this.usages = [
      { description: 'Disable a command for a role in a channel or channels', parameters: ['command id> in <channel> for <role|user'] },
    ];
    this.regex = new RegExp(
      `^${this.call}(?:\\s+(\\w*\\.*\\w*\\.*\\w*\\*?)(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here|\\*)(?:\\s+for\\s((?:\\<\\@\\&?)?\\d+(?:\\>)?|\\*))?)?)?`,
      'i',
    );
    this.blacklistable = false;
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const params = message.strippedContent.match(this.regex);
    if (!params[1]) {
      this.messageManager.embed(message, new EnableUsageEmbed(this.bot, params, 0), true, false);
      return this.messageManager.statuses.FAILURE;
    }
    params.splice(0, 1);
    const commands = this.getCommandsToEnable(params[0]);
    let channels = [];

    if (params[1]) {
      channels = getChannels(message.mentions.channels.length > 0
        ? message.mentions.channels : params[1].trim().replace(/<|>|#/ig, ''), message);
    } else {
      channels = [message.channel];
    }

    // targets
    let target = {};
    if (params[2] ||
        message.mentions.roles.array().length > 0 || message.mentions.users.array().length > 0) {
      target = getTarget(
        params[2], message.mentions ? message.mentions.roles : [],
        message.mentions ? message.mentions.users : [], message,
      );
    } else {
      target = message.guild.roles.find('name', '@everyone');
    }

    const results = [];
    // set the stuff
    for (const command of commands) {
      for (const channel of channels) {
        if (target.type === 'Role') {
          results.push(this.bot.settings
            .setChannelPermissionForRole(channel, target, command, 0));
        } else {
          results.push(this.bot.settings
            .setChannelPermissionForMember(channel, target, command, 0));
        }
      }
    }
    await Promise.all(results);
    // notify info embed
    const infoEmbed = new EnableInfoEmbed(this.bot, 0, [commands, channels, target.toString()]);
    const respondToSettings = await this.bot.settings
      .getChannelSetting(message.channel, 'respond_to_settings');
    if (respondToSettings) {
      this.messageManager.embed(message, infoEmbed, true, false);
    }
    return this.messageManager.statuses.SUCCESS;
  }

  /**
   * Get the list of commands based on input
   * @param {string} commandIdParam parameter for determining commands
   * @returns {Array<string>} command ids to enable
   */
  getCommandsToEnable(commandIdParam) {
    const commandsToEnable = [];
    const commandRegex = new RegExp(commandIdParam.replace('.', '\\.').replace('*', '.*'), 'ig');
    const commands = this.bot.commandHandler.commands
      .concat(this.bot.commandHandler.inlineCommands || [])
      .concat(this.bot.commandHandler.customCommands || []);
    commands.forEach((command) => {
      if (commandRegex.test(command.id) && command.blacklistable) {
        commandsToEnable.push(command.id);
      }
    });
    return commandsToEnable;
  }
}

module.exports = Disable;
