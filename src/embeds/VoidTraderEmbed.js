'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates alert embeds
 */
class VoidTraderEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {VoidTrader} voidTrader - The current state of the Void Trader
   */
  constructor(bot, voidTrader) {
    super(bot);

    this.color = voidTrader.isActive() ? 0x00ff00 : 0xff0000;

    if (voidTrader.isActive()) {
      this.fields = voidTrader.inventory.map(i => ({
        name: i.item,
        value: `${i.ducats} ducats + ${i.credits}cr`,
      }));
    } else {
      this.fields = [];
    }
    this.fields.push({
      name: `Time until ${voidTrader.isActive() ? 'departure from' : 'arrival at'} ${voidTrader.location}`,
      value: `${voidTrader.isActive() ? voidTrader.getEndString() : voidTrader.getStartString()}`,
    });
    this.title = 'Worldstate - Void Trader';
    this.description = 'Current Void Trader status';
    this.thumbnail = {
      url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/voidtrader.png',
    };
  }
}

module.exports = VoidTraderEmbed;
