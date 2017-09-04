'use strict';

const fs = require('fs');
const path = require('path');
const decache = require('decache');

/**
 * Describes a CommandHandler for a bot.
 */
class CommandHandler {
  /**
   * Constructs CommandHandler
   * @param {Genesis} bot    Bot to derive prefix for commands from
   */
  constructor(bot) {
    this.bot = bot;
    this.logger = bot.logger;

    /**
     * Array of command objects that can be called
     * @type {Array<Command>}
     * @private
     */
    this.commands = [];

    /**
     * Array of custom comamnd objects that can be called
     * @type {Array<Command>}
     * @private
     */
    this.customCommands = [];
  }

  /**
   * Loads the commands from disk into this.commands
   */
  loadCommands() {
    const commandDir = path.join(__dirname, 'commands');
    let files = fs.readdirSync(commandDir);

    const categories = files.filter(f => f.indexOf('.js') === -1);
    files = files.filter(f => f.indexOf('.js') > -1);

    categories.forEach((category) => {
      files = files.concat(fs.readdirSync(path.join(commandDir, category))
        .map(f => path.join(category, f)));
    });

    if (this.commands.length !== 0) {
      this.logger.debug('Decaching commands');
      files.forEach((f) => {
        decache(path.join(commandDir, f));
      });
    }

    this.logger.debug(`Loading commands: ${files}`);

    const commands = files.map((f) => {
      try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        const Cmd = require(path.join(commandDir, f));
        if (Object.prototype.toString.call(Cmd) === '[object Function]') {
          const command = new Cmd(this.bot);

          this.logger.debug(`Adding ${command.id}`);
          return command;
        }
        return null;
      } catch (err) {
        this.logger.error(err);
        return null;
      }
    })
    .filter(c => c !== null);

    this.commands = commands.filter(c => !c.isInline);

    this.inlineCommands = commands.filter(c => c.isInline);

    this.statuses = this.bot.messageManager.statuses;

    this.loadCustomCommands();
  }

  loadCustomCommands() {
    this.bot.settings.getCustomCommands()
      .then((customCommands) => {
        this.customCommands = customCommands;
      });
  }

  /**
   * Handle the command contained in the message contents, if any.
   * @param {Message} message Message whose command should be checked and handled
   */
  async handleCommand(message) {
    let content = message.content;
    const botping = `@${message.guild ?
          message.guild.members.get(this.bot.client.user.id).displayName :
          this.bot.client.user.username}`;
    const botPingId = `<@${this.bot.client.user.id}>`;
    const { prefix, allowCustom, allowInline } = await this.bot.settings
      .getCommandContext(message.channel);
    let checkOnlyInlines = false;
    const notStartWithPrefix = !content.startsWith(prefix)
      && !content.startsWith(botping) && !content.startsWith(botPingId);
    if (notStartWithPrefix) {
      if (allowInline && this.inlineCommands.length > 0) {
        checkOnlyInlines = true;
      } else {
        return;
      }
    }

    let commands = [];
    if (checkOnlyInlines) {
      commands = this.inlineCommands;
    } else if (allowCustom) {
      commands = this.commands.concat(this.customCommands);
    } else {
      commands = this.commands;
    }

    if (content.startsWith(prefix)) {
      content = content.replace(prefix, '');
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
        const canAct = await this.checkCanAct(command, messageWithStrippedContent,
          allowCustom, allowInline);
        if (canAct) {
          this.logger.debug(`Matched ${command.id}`);

          const status = await command.run(messageWithStrippedContent);
          const canReact = (message.channel.type === 'dm' ||
              (message.channel.permissionsFor(this.bot.client.user.id)
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
  async checkCanAct(command, message, allowCustom, allowInline) {
    if (command.isCustomCommand && allowCustom) {
      return command.isInline ? allowInline : true;
    } else if (command.isInline && allowInline) {
      return true;
    } else if (command.ownerOnly && message.author.id !== this.bot.owner) {
      return false;
    } else if (message.channel.type === 'text') {
      if (command.requiresAuth) {
        if (message.channel.permissionsFor(message.author).has('MANAGE_ROLES')) {
          try {
            return this.bot.settings
                   .getChannelPermissionForMember(message.channel,
                     message.author.id, command.id);
          } catch (err) {
            return this.bot.settings
                   .getChannelPermissionForUserRoles(message.channel,
                     message.author.id, command.id);
          }
        } else {
          return false;
        }
      } else {
        try {
          return this.bot.settings
                 .getChannelPermissionForMember(message.channel, message.author.id, command.id);
        } catch (err) {
          return this.bot.settings
                     .getChannelPermissionForUserRoles(message.channel, message.author, command.id);
        }
      }
    } else if (message.channel.type === 'dm' && command.allowDM) {
      return true;
    } else {
      return false;
    }
  }
}

module.exports = CommandHandler;
