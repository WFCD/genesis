'use strict';

const Command = require('../../Command.js');
const WeaponEmbed = require('../../embeds/WeaponEmbed.js');
const weapons = require('../../resources/weapons.json');

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
   */
  run(message) {
    let weapon = message.strippedContent.match(this.regex)[1];
    if (weapon) {
      weapon = weapon.trim().toLowerCase();
      const results = weapons.filter(entry => new RegExp(entry.regex, 'ig').test(weapon));
      if (results.length > 0) {
        this.messageManager.embed(message, new WeaponEmbed(this.bot, results[0]), true, false);
      } else {
        this.messageManager.embed(message, new WeaponEmbed(this.bot, undefined), true, false);
      }
    } else {
      this.messageManager.embed(message, new WeaponEmbed(this.bot, undefined), true, false);
    }
  }
}

module.exports = WeaponStats;
