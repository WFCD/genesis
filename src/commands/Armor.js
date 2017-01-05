'use strict';

const Command = require('../Command.js');

/**
 * Calculates the damage reduction for a given armor value
 * @param {number} currentArmor The enemy's armor
 * @returns {number}
 */
function damageReduction(currentArmor) {
  return currentArmor / (currentArmor + 300);
}

/**
 * Calculates the number of corrosive procs that would be needed to completely
 * strip armor from an enemy
 * @param {number} armor The enemy's armor
 * @returns {number}
 */
function armorStrip(armor) {
  return Math.ceil(8 * Math.log10(armor));
}

/**
 * Calculates an enemy armor at a given level
 * @param {number} baseArmor    The enemy's armor at the base level
 * @param {number} baseLevel    The enemy's base level
 * @param {number} currentLevel The level to calculate armor at
 * @returns {number}
 */
function armorAtLevel(baseArmor, baseLevel, currentLevel) {
  return baseArmor * (1 + (((currentLevel - baseLevel) ** 1.75) / 200));
}


/**
 * Performs armor calculations
 */
class Armor extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'misc.armor', 'armor', '');

    this.regex = new RegExp(`^${this.bot.escapedPrefix}armor(?:\\s+([\\d+\\.?\\d*\\s]+))?`, 'i');

    this.help = `${this.bot.prefix}armor           | Display instructions for calculating armor${this.md.lineEnd}` +
                `${this.bot.prefix}armor           | Display current damage resistance and amount of corrosive procs ` +
                `required to strip it. Params: <current armor>${this.md.lineEnd}` +
                `${this.bot.prefix}armor           | Display the current armor, damage resistance, and necessary ` +
                'corrosive procs to strip armor. Params: <base armor> <base level> <current level>';
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const pattern3Params = /(\d+\.?\d*)(?:\s+(\d+\.?\d*)\s+(\d+\.?\d*))?/;
    const params3 = message.content.match(pattern3Params);
    if (params3 && params3.length > 3) {
      const armor = params3[1];
      const baseLevel = params3[2];
      const currentLevel = params3[3];
      if (typeof baseLevel === 'undefined') {
        this.logger.debug('Entered 1-param armor');
        message.reply(this.armorSimple(parseInt(armor, 10)));
      } else {
        this.logger.debug('Entered 3-param armor');
        message.reply(this.armorFull(parseFloat(armor), parseFloat(baseLevel),
          parseFloat(currentLevel)));
      }
    } else {
      this.logger.debug('Entered 0-param armor');
      this.sendUsage(message);
    }
  }

  /**
   * Replies with details on the command's usage
   * @param {Message} message The message to reply to
   */
  sendUsage(message) {
    message.reply(this.md.codeMulti +
      [
        'Possible uses include:',
        `${this.bot.prefix}armor (Base Armor) (Base Level) (Current Level) calculate armor and stats.`,
        `${this.bot.prefix}armor (Current Armor) Calculate damage resistance.`,
      ].join(this.md.lineEnd) +
      this.md.blockEnd);
  }

  /**
   * Returns a string with details on an enemy's armor at a certain level
   * @param {number} baseArmor    The enemy's armor at the base level
   * @param {number} baseLevel    The enemy's base level
   * @param {number} currentLevel The level to calculate armor at
   * @returns {string}
   */
  armorFull(baseArmor, baseLevel, currentLevel) {
    const armor = armorAtLevel(baseArmor, baseLevel, currentLevel);
    return this.md.codeMulti +
      [
        `At level ${Math.round(currentLevel)} your enemy would have ${armor.toFixed(2)} Armor`,
        `${(damageReduction(armor) * 100).toFixed((2))}% damage reduction`,
        `You will need ${armorStrip(armor)} corrosive procs to strip your enemy of armor.`,
      ].join(this.md.lineEnd) +
      this.md.blockEnd;
  }

  /**
   * Returns a string with details on an enemy's armor
   * @param {number} armor    The enemy's armor
   * @returns {string}
   */
  armorSimple(armor) {
    return this.md.codeMulti +
      [
        `${(damageReduction(armor) * 100).toFixed(2)}% damage reduction`,
        `You will need ${armorStrip(armor)} corrosive procs to strip your enemy of armor.`,
      ].join(this.md.lineEnd) +
      this.md.blockEnd;
  }
}

module.exports = Armor;
