'use strict';

const Command = require('../../models/Command.js');
const { assetBase } = require('../../CommonFunctions');

const damageChart = `${assetBase}/img/damage-chart.png`;

/**
 * Displays the Damage 2.0 charts
 */
class Damage extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.damage', 'damage', 'Display Damage 2.0 chart', 'WARFRAME');
  }

  async run(message) {
    const embed = {
      title: 'Legend',
      image: {
        url: damageChart,
      },
      fields: [
        { name: 'Blast', value: '<:blast:363136256907149312>', inline: true },
        { name: 'Cold', value: '<:cold:363136256659685377>', inline: true },
        { name: 'Corrosive', value: '<:corrosive:363136257288568832>', inline: true },
        { name: 'Electricity', value: '<:electricity:363136257053949962>', inline: true },
        { name: 'Gas', value: '<:gas:363136257045561344>', inline: true },
        { name: 'Heat', value: '<:heat:363136256927858698>', inline: true },
        { name: 'Impact', value: '<:impact:363136256781189120>', inline: true },
        { name: 'Magnetic', value: '<:magnetic:363136420602445824>', inline: true },
        { name: 'Puncture', value: '<:puncture:363136257129185280>', inline: true },
        { name: 'Radiation', value: '<:radiation:363136256865075200>', inline: true },
        { name: 'Slash', value: '<:slash:363136256755892225>', inline: true },
        { name: 'Toxin', value: '<:toxin:363136256626130946>', inline: true },
        { name: 'Viral', value: '<:viral:363136256747765763>', inline: true },
      ],
    };
    await message.reply({ embeds: [embed] });
    return this.constructor.statuses.SUCCESS;
  }
}

module.exports = Damage;
