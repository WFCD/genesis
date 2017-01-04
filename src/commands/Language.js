'use strict';

const langs = require('../resources/strings.json').languages;
const Command = require('../Command.js');
const md = require('node-md-config');


/**
 * Describes the Armor command
 */
class Language extends Command {
  /**
   * Constructs a callable command
   * @param  {Logger}           logger                The logger object
   * @param  {string}           [options.prefix]      Prefix for calling the bot
   * @param  {string}           [options.regexPrefix] Escaped prefix for regex for the command
   * @param  {MarkdownSettings} [options.mdConfig]    The markdown settings
   * @param  {Database}         [options.settings]    Settings for this bot
   */
  // eslint-disable-next-line no-useless-escape
  constructor(logger, { mdConfig = md, regexPrefix = '\/', prefix = '/', commandHandler = null } = {}) {
    super(logger, { mdConfig, regexPrefix, prefix, commandHandler });
    this.commandId = 'settings.language';
    // eslint-disable-next-line no-useless-escape
    this.commandRegex = new RegExp(`^${regexPrefix}language (.+)$`, 'i');
    this.commandHelp = `${prefix}toggle response | Toggle response to tsettings changes in this channel `;
    this.requiresAuth = true;
    this.blacklistable = true;
    this.stringManager = commandHandler.stringManager;
  }

  run(message, { settings = null, stringManager = null } = {}) {
    const language = this.commandRegex
      .exec(message.cleanContent.match(this.commandRegex)[0])[1].trim();
    const langAllowed = typeof langs[`${language}`] !== 'undefined';
    if (settings !== null) {
      settings.getChannelLanguage(message.channel.id)
        .then((currLanguage) => {
          let needToCallSet = true;
          if (currLanguage === language) {
            needToCallSet = false;
          }
          if (needToCallSet) {
            if (language !== null) {
              settings.setChannelLanguage(message.channel.id, language)
                .then((r) => {
                  this.logger.debug(r);
                  settings.getChannelRespondToSettings(message.channel.id)
                    .then((respond) => {
                      if (respond) {
                        stringManager.getString('language_set', message, { command: language })
                          .then(str => message.reply(str.replace(/\$language/i, language)))
                          .catch(this.logger.error);
                      }
                    });
                });
            }
          } else if (!langAllowed || !needToCallSet) {
            settings.getChannelRespondToSettings(message.channel.id)
              .then((respond) => {
                if (respond) {
                  stringManager.getString('language_not_set', message, { command: language })
                    .then(str => message.reply(str.replace(/\$language/i, language)))
                    .catch(this.logger.error);
                }
              });
          }
        });

      settings.getChannelRespondToSettings(message.channel.id)
        .then((respond) => {
          this.logger.debug(respond);
        });
      if (message.deletable) {
        message.delete(5000);
      }
    }
  }
}

module.exports = Language;
