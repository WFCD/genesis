'use strict';

const Handler = require('../models/BaseEventHandler');

const checkInlineCustom = (hasAuth, allowCustom, allowInline, command) => {
  if ((command.isCustom && allowCustom) || (command.isInline && allowInline)) {
    return hasAuth;
  }
  if (!command.isCustom && !command.isInline) {
    return hasAuth;
  }
  return false;
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

    if (!passesInitial) {
      return;
    }
    let { content } = message;
    let botping;
    if (message.guild) {
      if (message.guild.members.has(this.bot.client.user.id)) {
        botping = `@${message.guild.members.get(this.bot.client.user.id).displayName}`;
      }
    }
    if (typeof botping === 'undefined') {
      botping = `@${this.bot.client.user.username}`;
    }
    const botPingId = `<@${this.bot.client.user.id}>`;
    const ctx = await this.bot.settings
      .getCommandContext(message.channel);
    let checkOnlyInlines = false;
    const notStartWithPrefix = !content.startsWith(ctx.prefix)
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

    if (content.startsWith(ctx.prefix)) {
      content = content.replace(ctx.prefix, '');
    }
    if (content.startsWith(botping)) {
      content = content.replace(new RegExp(`${botping}\\s+`, 'i'), '');
    }
    if (content.startsWith(botPingId)) {
      content = content.replace(new RegExp(`${botPingId}\\s+`, 'i'), '');
    }
    const messageWithStrippedContent = message;
    messageWithStrippedContent.strippedContent = content;
    this.logger.debug(`Handling \`${content}\``);
    let done = false;
    commands.forEach(async (command) => {
      if (command.regex.test(content) && !done) {
        const canAct = await this.checkCanAct(command, messageWithStrippedContent);
        if (checkInlineCustom(canAct, ctx.allowCustom, ctx.allowInline, command)) {
          this.logger.debug(`Matched ${command.id}`);
          ctx.message = messageWithStrippedContent;
          const cmd = await this.bot.commandManager.loadCommand(command);
          const status = await cmd.run(messageWithStrippedContent, ctx);
          const canReact = (message.channel.type === 'dm'
                || (message.channel.permissionsFor(this.bot.client.user.id)
                  .has(['ADD_REACTIONS', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS']))) && !command.isInline;
          switch (status) {
            case this.statuses.SUCCESS:
              if (canReact) {
                message.react('✅');
              }
              break;
            case this.statuses.FAILURE:
              if (canReact) {
                message.react('❌');
              }
              break;
            case this.statuses.NO_ACCESS:
            default:
              break;
          }
          done = true;
        }
      }
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

module.exports = CommandHandler;
