'use strict';

const Command = require('../../models/Command.js');
const EnableUsageEmbed = require('../../embeds/EnableUsageEmbed.js');
const EnableInfoEmbed = require('../../embeds/EnableInfoEmbed.js');
const { getTarget, getChannels, captures } = require('../../CommonFunctions.js');

const commandIdRegex = new RegExp('(\\w*\\.*\\w*\\.*\\w*\\*?)', 'ig');
const locationRegex = new RegExp(`(?:\\s+in\\s+(${captures.channel}|here|\\*))`, 'ig');
const appliesToRegex = new RegExp(`(?:\\s+for\\s(${captures.user}|${captures.role}|\\*))?`, 'ig');

class Enable extends Command {
  constructor(bot) {
    super(bot, 'settings.enable', 'enable', 'Enable a command.');
    this.usages = [
      { description: 'Enable a command for a role in a channel or channels', parameters: ['command id> in <channel> for <role|user'] },
    ];
    this.regex = new RegExp(
      `^${this.call}`,
      'i',
    );
    this.requiresAuth = true;
    this.blacklistable = false;
    this.allowDM = false;
  }

  async run(message) {
    const commandIdResults = message.strippedContent.match(commandIdRegex)
      .filter(str => str && !(str === this.call) && str.trim().length);
    const commandIdResult = commandIdResults.length ? commandIdResults[0] : undefined;
    const channelResult = (message.strippedContent.match(locationRegex) || ['', 'here'])[0].replace('in', '').replace(/<#/g, '').replace(/>/g, '').trim();
    const t = message.strippedContent.match(appliesToRegex).filter(str => str.length);
    const targetResult = (t.length ? t : [message.guild.defaultRole.id])[0]
      .replace(/<@&?/g, '').replace(/>/g, '').replace('for', '').trim();
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
    target = getTarget(
      targetResult, message.mentions ? message.mentions.roles : [],
      message.mentions ? message.mentions.users : [], message,
    );

    if (!commands.length) {
      this.messageManager.embed(message, new EnableUsageEmbed(this.bot, [
        commandIdResult,
        channelResult,
        targetResult,
      ], 1), true, false);
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
              .setChannelPermissionForRole(channel, target, command, 1));
          } else {
            results.push(this.settings
              .setChannelPermissionForMember(channel, target, command, 1));
          }
        } catch (error) {
          this.logger.error(error);
        }
      });
    });
    await Promise.all(results);
    // notify info embed
    const infoEmbed = new EnableInfoEmbed(this.bot, 1, [commands, channels, target.toString()]);
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

module.exports = Enable;
