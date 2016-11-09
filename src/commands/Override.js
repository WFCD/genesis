'use strict';

const Command = require('../Command.js');
const md = require('node-md-config');

/**
 * Describes the Armor command
 */
class Override extends Command {
  /**
   * Constructs a callable command
   * @param  {Logger}           logger                The logger object
   * @param  {string}           [options.prefix]      Prefix for calling the bot
   * @param  {string}           [options.regexPrefix] Escaped prefix for regex for the command
   * @param  {MarkdownSettings} [options.mdConfig]    The markdown settings
   * @param  {Settings}         [options.settings]    Settings for this bot
   */
  // eslint-disable-next-line no-useless-escape
  constructor(logger, { mdConfig = md, regexPrefix = '\/', prefix = '/', commandHandler = null } = {}) {
    super(logger, { mdConfig, regexPrefix, prefix, commandHandler });
    this.commandId = 'settings.override';
    // eslint-disable-next-line no-useless-escape
    this.commandRegex = new RegExp(`^${regexPrefix}toggle override$`, 'i');
    this.commandHelp = `${prefix}toggle override | Toggle the command override for allowing an admin user to call commands `;
    this.requiresAuth = true;
    this.blacklistable = false;
  }

  run(message, { settings = null, stringManager = null } = {}) {
    if (settings !== null) {
      settings.getOverride(message.channel.id)
      .then((override) => {
        settings.setOverride(message.channel.id, !override)
          .then((r) => {
            this.logger.debug(r);
            settings.getRespond(message.channel.id)
              .then((respondInChannel) => {
                if (respondInChannel) {
                  settings.getOverride(message.channel.id)
                  .then((newOverride) => {
                    if (newOverride === override) {
                      stringManager.getString('override_toggle_error', message, { command: this.commandId })
                        .then((localized) => {
                          message.reply(localized)
                            .then((msg) => {
                              if (msg.deletable) {
                                msg.delete(10000);
                              }
                            });
                        })
                        .catch(this.logger.error);
                      return;
                    }
                    if (!newOverride) {
                      stringManager.getString('override_disabled', message, { command: this.commandId })
                        .then((localized) => {
                          message.reply(localized)
                            .then((msg) => {
                              if (msg.deletable) {
                                msg.delete(10000);
                              }
                            });
                        })
                        .catch(this.logger.error);
                    } else {
                      stringManager.getString('override_enabled', message, { command: this.commandId })
                        .then((localized) => {
                          message.reply(localized)
                            .then((msg) => {
                              if (msg.deletable) {
                                msg.delete(10000);
                              }
                            });
                        })
                        .catch(this.logger.error);
                    }
                  })
                  .catch(this.logger.error);
                }
              })
              .catch(this.logger.error);
          })
          .catch(this.logger.error);
      })
      .catch(this.logger.error);
    }
    if (message.deletable) {
      message.delete(5000);
    }
  }
}

module.exports = Override;
