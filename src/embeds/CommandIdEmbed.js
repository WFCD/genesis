'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Utility class for making rich embeds
 */
class CommandIdEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array<string>} commandIds - a list of commands for ids to send
   */
  constructor(bot, commandIds) {
    super();
    this.url = 'https://discord.io/cephalon-sanctuary';

    this.footer = {
      icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
      text: 'Data provided by Warframe Community Developers',
    };
    this.fields = [{
      name: '_ _',
      value: commandIds.map(command => (`**${command.call}**: ${command.id}`)).join('; '),
    }];
  }
}

module.exports = CommandIdEmbed;
