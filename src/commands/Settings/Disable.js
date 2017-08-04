'use strict';

const Command = require('../../Command.js');
const EnableUsageEmbed = require('../../embeds/EnableUsageEmbed.js');
const EnableInfoEmbed = require('../../embeds/EnableInfoEmbed.js');

class Disable extends Command {
  constructor(bot) {
    super(bot, 'settings.disable', 'disable', 'Disable a command.');
    this.usages = [
      { description: 'Disable a command for a role in a channel or channels', parameters: ['command id> in <channel> for <role|user'] },
    ];
    this.regex = new RegExp(`^${this.call}(?:\\s+(\\w*\\.*\\w*\\.*\\w*\\*?)(?:\\s+in\\s+((?:\\<\\#)?\\d+(?:\\>)?|here|\\*)(?:\\s+for\\s((?:\\<\\@\\&?)?\\d+(?:\\>)?|\\*))?)?)?`,
      'i');
    this.blacklistable = false;
    this.requiresAuth = true;
  }

  run(message) {
    const params = message.strippedContent.match(this.regex);
    if (!params[1]) {
      this.messageManager.embed(message, new EnableUsageEmbed(this.bot, params, 0), true, false);
    } else {
      params.splice(0, 1);
      const commands = this.getCommandsToEnable(params[0]);
      let channels = [];

      if (params[1]) {
        channels = this.getChannels(message.mentions.channels.length > 0
          ? message.mentions.channels : params[1].trim().replace(/<|>|#/ig, ''), message);
      } else {
        channels = [message.channel];
      }

      let target = {};
      if (params[2] ||
        message.mentions.roles.array().length > 0 || message.mentions.users.array().length > 0) {
        target = this.getTarget(params[2], message.mentions ? message.mentions.roles : [],
          message.mentions ? message.mentions.users : [], message);
      } else {
        target = message.guild.roles.find('name', '@everyone');
      }
      const infoEmbed = new EnableInfoEmbed(this.bot, 0, [commands, channels, target.toString()]);
      const promises = [];
      this.bot.settings.getChannelResponseToSettings(message.channel)
        .then((respondToSettings) => {
          if (respondToSettings) {
            this.messageManager.embed(message, infoEmbed, true, false);
          }
        });
      commands.forEach((command) => {
        channels.forEach((channel) => {
          if (target.type === 'Role') {
            promises.push(this.bot.settings
              .setChannelPermissionForRole(channel, target, command, 0));
          } else {
            promises.push(this.bot.settings
              .setChannelPermissionForMember(channel, target, command, 0));
          }
        });
      });
      promises.forEach((promise) => {
        promise.catch(this.logger.error);
      });
    }
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

  /**
   * Get the list of channels to enable commands in based on the parameters
   * @param {string|Array<Channel>} channelsParam parameter for determining channels
   * @param {Message} message Discord message to get information on channels
   * @returns {Array<string>} channel ids to enable commands in
   */
  getChannels(channelsParam, message) {
    let channels = [];
    if (typeof channelsParam === 'string') {
      // handle it for strings
      if (channelsParam !== '*' && channelsParam !== 'here') {
        channels.push(this.bot.client.channels.get(channelsParam.trim()));
      } else if (channelsParam === '*') {
        channels = channels.concat(message.guild.channels.array().filter(channel => channel.type === 'text'));
      } else if (channelsParam === 'here') {
        channels.push(message.channel);
      }
    } else {
      channels.concat(channelsParam);
    }
    return channels;
  }

  /**
   * Get the target role or user from the parameter string
   *    or role mentions or user mentions, preferring the latter 2.
   * @param {string} targetParam string from the command to determine the user or role
   * @param {Array<Role>} roleMentions role mentions from the command
   * @param {Array<User>} userMentions user mentions from the command
   * @param {Message} message message to get information on users and roles
   * @returns {Role|User} target or user to disable commands for
   */
  getTarget(targetParam, roleMentions, userMentions, message) {
    let target;
    if (roleMentions.array().length > 0) {
      target = roleMentions.array()[0];
      target.type = 'Role';
    } else if (userMentions.array().length > 0) {
      target = userMentions.array()[0];
      target.type = 'User';
    } else {
      const userTarget = this.bot.client.users.get(targetParam);
      const roleTarget = message.guild.roles.get(targetParam);
      if (targetParam === '*') {
        target = message.guild.roles.find('name', '@everyone');
        target.type = 'Role';
      } else if (roleTarget) {
        target = roleTarget;
        target.type = 'Role';
      } else if (userTarget) {
        target = userTarget;
        target.type = 'User';
      } else {
        target = '';
      }
    }
    return target;
  }
}

module.exports = Disable;
