'use strict';

const Command = require('../../models/Command.js');
const EnableUsageEmbed = require('../../embeds/EnableUsageEmbed.js');
const EnableInfoEmbed = require('../../embeds/EnableInfoEmbed.js');
const { getChannels, getTarget } = require('../../CommonFunctions');

const commandIdRegex = new RegExp('(\\w*\\.*\\w*\\.*\\w*\\*?)', 'ig');
const locationRegex = new RegExp('(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here|\\*))', 'ig');
const appliesToRegex = new RegExp('(?:\\s+for\\s((?:\\<\\@\\&?)?\\d+(?:\\>)?|\\*))?', 'ig');

class Disable extends Command {
  constructor(bot) {
    super(bot, 'settings.disable', 'disable', 'Disable a command.');
    this.usages = [
      { description: 'Disable a command for a role in a channel or channels', parameters: ['command id> in <channel> for <role|user'] },
    ];
    this.regex = new RegExp(
      `^${this.call}`,
      'i',
    );
    this.blacklistable = false;
    this.requiresAuth = true;
    this.allowDM = false;
  }

  async run(message) {
    const params = message.strippedContent.match(this.regex);

    const commandIdResults = message.strippedContent.match(commandIdRegex)
      .filter(str => str && !(str === this.call) && str.trim().length);
    const commandIdResult = commandIdResults.length ? commandIdResults[0] : undefined;
    const channelResult = (message.strippedContent.match(locationRegex) || ['', 'here'])[1];
    const targetResult = (message.strippedContent.match(appliesToRegex) || ['', message.guild.defaultRole.id])[1];
    this.logger.debug(`params: ${commandIdResult} | ${channelResult} | ${targetResult}`);
    const commands = this.getCommandsToEnable(commandIdResult).filter(command => command);
    let channels = [];

    channels = getChannels(message.mentions.channels.length > 0
      ? message.mentions.channels : channelResult, message);
    channels = channels.filter(channel => typeof channel !== 'undefined' && channel !== null);
    if (!channels.length) {
      channels = [message.channel];
    }

    // targets
    let target = {};
    if (targetResult || message.mentions.roles.size > 0 || message.mentions.users.size > 0) {
      target = getTarget(
        params[2], message.mentions ? message.mentions.roles : [],
        message.mentions ? message.mentions.users : [], message,
      );
    } else {
      target = getTarget(
        params[1], { first: () => undefined },
        { first: () => undefined }, message,
      ) || message.guild.defaultRole;
    }

    if (!commands.length) {
      this.messageManager.embed(message, new EnableUsageEmbed(this.bot, params, 0), true, false);
      return this.messageManager.statuses.FAILURE;
    }

    const results = [];
    // set the stuff
    commands.forEach((command) => {
      channels.forEach((channel) => {
        if (!channel) return;
        try {
          if (target.type === 'Role') {
            results.push(this.settings
              .setChannelPermissionForRole(channel, target, command, 0));
          } else {
            results.push(this.settings
              .setChannelPermissionForMember(channel, target, command, 0));
          }
        } catch (error) {
          this.logger.error(error);
        }
      });
    });
    await Promise.all(results);
    // notify info embed
    const infoEmbed = new EnableInfoEmbed(this.bot, 0, [commands, channels, target.toString()]);
    const respondToSettings = await this.settings
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
    const commands = this.commandManager.commands
      .concat(this.commandManager.inlineCommands || [])
      .concat(this.commandManager.customCommands || []);
    commands.forEach((command) => {
      if (commandRegex.test(command.id) && command.blacklistable) {
        commandsToEnable.push(command.id);
      }
    });
    return commandsToEnable;
  }
}

module.exports = Disable;
