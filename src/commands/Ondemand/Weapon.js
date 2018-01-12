'use strict';

const Command = require('../../Command.js');
const WeaponEmbed = require('../../embeds/WeaponEmbed.js');
const request = require('request-promise');

/**
 * Displays the stats for a warframe
 */
class WeaponStats extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.weaponstats', 'weapon', 'Get stats for a weapon');
    this.regex = new RegExp(`^${this.call}\\s?(.+)?`, 'i');
    this.usages = [
      {
        description: 'Get stats for a Warframe',
        parameters: ['weapon name'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    let weapon = message.strippedContent.match(this.regex)[1];
    if (weapon) {
      weapon = weapon.trim().toLowerCase();
      const options = {
        uri: `https://api.warframestat.us/weapons?search=${weapon}`,
        json: true,
        rejectUnauthorized: false,
      };
      const results = await request(options);
      if (results.length > 0) {
        this.messageManager.embed(message, new WeaponEmbed(this.bot, results[0]), true, false);
        return this.messageManager.statuses.SUCCESS;
      }
      this.messageManager.embed(message, new WeaponEmbed(this.bot, undefined), true, false);
      return this.messageManager.statuses.FAILURE;
    }
    this.messageManager.embed(message, new WeaponEmbed(this.bot, undefined), true, false);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = WeaponStats;
