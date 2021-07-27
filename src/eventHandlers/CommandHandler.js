'use strict';

const Handler = require('../models/BaseEventHandler');
const I18n = require('../settings/I18n');
const { games, emojify } = require('../CommonFunctions');

const { Permissions } = require('discord.js');

/**
 * Checks if the command is callable,
 * checking if the user has authorization, if custom is allowed
 * @param  {boolean} hasAuth     whether or not the caller has authorization
 * @param  {boolean} allowCustom whether or not custom commands are allowed
 * @param  {boolean}  allowInline whether or not inline commands are allowed
 * @param  {Command}  command     the command manifest
 * @returns {boolean}              whether or not the settings allow this command to be called
 */
const checkInlineCustom = (hasAuth, allowCustom, allowInline, command) => {
  if ((command.isCustom && allowCustom) || (command.isInline && allowInline)) {
    return hasAuth;
  }
  if (!command.isCustom && !command.isInline) {
    return hasAuth;
  }
  return false;
};

const stripContent = (content, prefix, ping, pingId, botNickPing) => {
  let c = content;
  if (content.startsWith(prefix)) {
    c = content.replace(prefix, '');
  }
  if (content.startsWith(ping)) {
    c = content.replace(new RegExp(`${ping}\\s+`, 'i'), '');
  }
  if (content.startsWith(pingId)) {
    c = content.replace(new RegExp(`${pingId}\\s+`, 'i'), '');
  }
  if (content.startsWith(botNickPing)) {
    c = content.replace(new RegExp(`${botNickPing}\\s+`, 'i'), '');
  }
  return c;
};

const hasAuth = message => {
  return message?.channel?.permissionsFor(message.author)?.has(Permissions.FLAGS.MANAGE_ROLES)
    || message?.channel?.permissionsFor(message.author)?.has(Permissions.FLAGS.MANAGE_GUILD)
    || message?.channel?.permissionsFor(message.author)?.has(Permissions.FLAGS.MANAGE_ROLES)
  };

/**
 * Describes a handler
 */
class CommandHandler extends Handler {
  /**
   * Base class for bot commands
   * @param {Genesis} bot  The bot object
   * @param {string}  id   The command's unique id
   * @param {string}  event Event to trigger this handler
   */
  constructor(bot) {
    super(bot, 'handlers.command', 'message');

    this.statuses = this.bot.messageManager.statuses;
    this.commandManager = this.bot.commandManager;
    this.logger = bot.logger;
  }

  /**
   * Handle a message for commands
   * @param {Message} message message to check for commands
   */
  async execute(...[message]) {
    const passesInitial = this.bot.readyToExecute
      && message.author.id !== this.bot.client.user.id
      && !message.author.bot;

    const canReply = message.channel.type === 'dm' || hasAuth(message);

    if (!(passesInitial && canReply)) {
      return;
    }
    let { content } = message;
    let botping;
    if (message.guild) {
      if (message.guild.members.me) {
        botping = `@${message.guild.me.displayName}`;
      }
    }
    if (typeof botping === 'undefined') {
      botping = `@${message.guild ? message.guild.me.displayName : this.bot.client.user.username}`;
    }
    const botPingId = `<@${this.bot.client.user.id}>`;
    const botNickPing = `<@!${this.bot.client.user.id}>`;
    const ctx = await this.bot.settings.getCommandContext(message.channel, message.author);
    this.logger.silly(`${message.author.id} is ${ctx.isBlacklisted ? '' : 'not '}blacklisted`);
    if (ctx.isBlacklisted) {
      return;
    }

    let checkOnlyInlines = false;

    const notStartWithPrefix = !content.startsWith(ctx.prefix) && !content.startsWith(botNickPing)
      && !content.startsWith(botping) && !content.startsWith(botPingId);
    if (notStartWithPrefix) {
      if (ctx.allowInline && this.commandManager.inlineCommands.length > 0) {
        checkOnlyInlines = true;
      } else {
        return;
      }
    }

    let commands = [];
    if (checkOnlyInlines) {
      commands = this.commandManager.inlineCommands;
    } else if (ctx.allowCustom) {
      commands = this.commandManager.commands.concat(this.commandManager.customCommands);
    } else {
      ({ commands } = this.commandManager);
    }
    commands = commands.filter(command => command);

    // strip content
    const strippedMessage = message;
    content = stripContent(content, ctx.prefix, botping, botPingId, botNickPing);
    strippedMessage.strippedContent = content;

    // set new context objects
    ctx.message = strippedMessage;
    this.logger.silly(`Handling \`${content}\``);

    let done = false;
    commands.forEach(async (command) => {
      // only run the first matching command
      if (games.includes(command.game) && command.regex.test(content) && !done) {
        // check if it's runnable for the user
        const canAct = await this.checkCanAct(command, strippedMessage);
        if (checkInlineCustom(canAct, ctx.allowCustom, ctx.allowInline, command)) {
          this.logger.silly(`Matched ${command.id}`);

          // load command
          const cmd = await this.bot.commandManager.loadCommand(command);
          if (cmd.parseArgs) {
            ctx.args = cmd.parseArgs(message.content);
          }

          // run
          try {
            const status = await cmd.run(strippedMessage, ctx);

            // react based on result
            const canReact = (message.channel.type === 'dm'
                  || (message.channel.permissionsFor(this.bot.client.user.id)
                    .has([
                      Permissions.FLAGS.ADD_REACTIONS,
                      Permissions.FLAGS.VIEW_CHANNEL,
                      Permissions.FLAGS.SEND_MESSAGES,
                      Permissions.FLAGS.EMBED_LINKS
                    ]))) && !command.isInline;
            switch (status) {
              case this.statuses.SUCCESS:
                if (canReact) {
                  message.react(emojify('green_tick'));
                }
                break;
              case this.statuses.FAILURE:
                if (canReact) {
                  message.react(emojify('red_tick'));
                }
                break;
              case this.statuses.NO_ACCESS:
              default:
                break;
            }
          } catch (error) {
            this.logger.error(error);
          } finally {
            // make sure we don't run more
            done = true;
          }
        }
      }
      // force last index to 0 for any global checkers
      // eslint-disable-next-line no-param-reassign
      command.regex.lastIndex = 0;
    });
  }

  /**
   * Check if the current command being called is able to be performed for the user calling it.
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
        if (hasAuth(message)) {
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

module.exports = CommandHandler;
