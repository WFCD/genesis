'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase } = require('../CommonFunctions');

const baroThumb = `${assetBase}/img/baro.png`;

/**
 * Generates void trader embeds
 */
class VoidTraderEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {VoidTrader} voidTrader - The current state of the Void Trader
   * @param {string} platform - platform
   */
  constructor(bot, voidTrader, platform) {
    super();

    this.color = voidTrader.active ? 0x0EC9FF : 0xff6961;

    if (voidTrader.active || voidTrader.inventory.length > 0) {
      this.fields = voidTrader.inventory.map(i => ({
        name: i.item,
        value: `${i.ducats} ducats + ${i.credits}cr`,
        inline: true,
      }));
    } else {
      this.fields = [];
    }
    this.fields.push({
      name: `Time until ${voidTrader.active ? 'departure from' : 'arrival at'} ${voidTrader.location}`,
      value: `${voidTrader.active ? voidTrader.endString : voidTrader.startString}` || 'Data Pending',
    });
    this.title = `[${platform.toUpperCase()}] Worldstate - Void Trader`;
    this.thumbnail = {
      url: baroThumb,
    };
  }
}

module.exports = VoidTraderEmbed;
