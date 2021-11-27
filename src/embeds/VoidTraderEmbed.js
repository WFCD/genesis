'use strict';

const n = require('numeral');

const BaseEmbed = require('./BaseEmbed.js');
const { assetBase, emojify } = require('../CommonFunctions');

const baroThumb = `${assetBase}/img/baro.png`;

/**
 * Generates void trader embeds
 */
class VoidTraderEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {VoidTrader} voidTrader - The current state of the Void Trader
   * @param {string} platform - platform
   * @param {boolean} onDemand - Whether or not the embed is created from an onDemand command
   */
  constructor(bot, voidTrader, platform, onDemand) {
    super();

    this.color = voidTrader?.active ? 0x0EC9FF : 0xff6961;

    if (voidTrader?.active && voidTrader?.inventory?.length > 0) {
      this.fields = voidTrader?.inventory.map((i) => {
        const d = `${n(i.ducats).format('0a')}${onDemand ? emojify('ducats') : 'ducats'}`;
        const cr = `${n(i.credits).format('0a')}${onDemand ? emojify('credits') : '*cr*'}`;
        return {
          name: i.item,
          value: `${d} + ${cr}`,
          inline: true,
        };
      });
    } else {
      this.fields = [];
    }
    this.fields.push({
      name: `Time until ${voidTrader.active ? 'departure from' : 'arrival at'} ${voidTrader.location}`,
      value: `${voidTrader?.active ? voidTrader.endString : voidTrader.startString}` || 'Data Pending',
    });
    this.title = `[${platform.toUpperCase()}] Worldstate - Void Trader`;
    this.thumbnail = {
      url: baroThumb,
    };
  }
}

module.exports = VoidTraderEmbed;
