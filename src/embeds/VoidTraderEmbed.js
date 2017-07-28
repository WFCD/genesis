'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates void trader embeds
 */
class VoidTraderEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {VoidTrader} voidTrader - The current state of the Void Trader
   */
  constructor(bot, voidTrader) {
    super();

    this.color = voidTrader.isActive() ? 0x0EC9FF : 0xff6961;

    if (voidTrader.isActive() || voidTrader.inventory.length > 0) {
      this.fields = voidTrader.inventory.map(i => ({
        name: i.item,
        value: `${i.ducats} ducats + ${i.credits}cr`,
        inline: true,
      }));
    } else {
      this.fields = [];
    }
    this.fields.push({
      name: `Time until ${voidTrader.isActive() ? 'departure from' : 'arrival at'} ${voidTrader.location}`,
      value: `${voidTrader.isActive() ? voidTrader.getEndString() : voidTrader.getStartString()}` || 'Data Pending',
    });
    this.title = 'Worldstate - Void Trader';
    this.thumbnail = {
      url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/voidtrader.png',
    };
  }
}

module.exports = VoidTraderEmbed;
