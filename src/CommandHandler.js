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

    this.commands = files.map((f) => {
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

    this.bot.settings.getCustomCommands()
      .then((customCommands) => {
        this.customCommands = customCommands;
      });
  }

  /**
   * Handle the command contained in the message contents, if any.
   * @param {Message} message Message whose command should be checked and handled
   */
  handleCommand(message) {
    let content = message.content;
    const botping = `@${message.guild ?
          message.guild.members.get(this.bot.client.user.id).displayName :
          this.bot.client.user.username}`;
    const botPingId = `<@${this.bot.client.user.id}>`;
    this.bot.settings.getCommandContext(message.channel)
      .then(({ prefix, allowCustom, allowInline }) => {
        if (!content.startsWith(prefix)
            && !content.startsWith(botping)
            && !content.startsWith(botPingId)) {
          return;
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
        this.commands.concat(this.customCommands).forEach((command) => {
          if (command.regex.test(content)) {
            this.checkCanAct(command, messageWithStrippedContent, allowCustom, allowInline)
            .then((canAct) => {
              if (canAct) {
                this.logger.debug(`Matched ${command.id}`);
                if (message.channel.type === 'dm' ||
                  (message.channel.permissionsFor(this.bot.client.user.id)
                   .has(['ADD_REACTIONS', 'READ_MESSAGES', 'SEND_MESSAGES', 'EMBED_LINKS']))) {
                  message.react('✅').catch(this.logger.error);
                }
                command.run(messageWithStrippedContent);
              }
            });
          }
        });
      })
      .catch(this.logger.error);
  }

  /**
   * Check if the current command being called is able to be performed for the user calling it.
   * @param   {Command} command  command to process to see if it can be called
   * @param   {Message} message Discord message object
   * @param   {boolean} allowCustom Whether or not to allow custom commands
   * @param   {boolean} allowInline Whether or not to allow inline commands
   * @returns {Promise<boolean>} Whether or not the ucrrent command can be called by the author
   */
  checkCanAct(command, message, allowCustom, allowInline) {
    return new Promise((resolve) => {
      if (command.isCustomCommand && allowCustom) {
        resolve(command.inline ? allowInline : true);
      } else if (command.ownerOnly && message.author.id !== this.bot.owner) {
        resolve(false);
      } else if (message.channel.type === 'text') {
        if (command.requiresAuth) {
          if (message.channel.permissionsFor(message.author).has('MANAGE_ROLES')) {
            this.bot.settings
            .getChannelPermissionForMember(message.channel, message.author.id, command.id)
              .then((userHasPermission) => {
                resolve(userHasPermission);
              })
              .catch(() => {
                this.bot.settings
                .getChannelPermissionForUserRoles(message.channel,
                  message.author, command.id)
                  .then((userHasPermission) => {
                    resolve(userHasPermission);
                  });
              });
          } else {
            resolve(false);
          }
        } else {
          this.bot.settings
          .getChannelPermissionForMember(message.channel, message.author.id, command.id)
            .then((userHasPermission) => {
              resolve(userHasPermission);
            })
            .catch(() => {
              this.bot.settings
              .getChannelPermissionForUserRoles(message.channel,
                message.author, command.id)
                .then((userHasPermission) => {
                  resolve(userHasPermission);
                });
            });
        }
      } else if (message.channel.type === 'dm' && command.allowDM) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }
}

module.exports = CommandHandler;
