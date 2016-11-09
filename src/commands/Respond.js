'use strict';

const Command = require('../Command.js');
const md = require('node-md-config');

/**
 * Describes the Armor command
 */
class Respond extends Command {
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
    this.commandId = 'settings.response';
    // eslint-disable-next-line no-useless-escape
    this.commandRegex = new RegExp(`^${regexPrefix}toggle response$`, 'i');
    this.commandHelp = `${prefix}toggle response | Toggle response to tsettings changes in this channel `;
    this.requiresAuth = true;
    this.blacklistable = false;
  }

  run(message, { settings = null, stringManager = null } = {}) {
    if (settings !== null) {
      settings.getRespond(message.channel.id)
      .then((respond) => {
        settings.setRespond(message.channel.id, !respond)
          .then((r) => {
            this.logger.debug(r);
            settings.getRespond(message.channel.id)
              .then(() => {
                settings.getRespond(message.channel.id)
                  .then((newRespond) => {
                    if (newRespond === respond) {
                      stringManager.getString('response_toggle_error', message, { command: this.commandId })
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
                    if (!newRespond) {
                      stringManager.getString('response_disabled', message, { command: this.commandId })
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
                      stringManager.getString('response_enabled', message, { command: this.commandId })
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

module.exports = Respond;
