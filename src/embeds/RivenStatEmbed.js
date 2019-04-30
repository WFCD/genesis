'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
class RivenStatEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Object} rivenResult details to derive data from
   * @param {string} resultKey The query that this search corresponds to
   * @param {fn}  i18n internationalization function to give string in apprpriate language
   */
  constructor(bot, rivenResult, resultKey, i18n) {
    super();
    this.thumbnail = {
      url: 'https://i.imgur.com/luKxF3t.png',
    };
    this.fields = [];
    if(rivenResult.rerolled) {
      this.fields.push(...[{
        name: i18n`Rerolled`,
        value: '\u200B',
        inline: false,
      }, {
        name: i18n`Average Cost`,
        value: `${rivenResult.rerolled.avg}`,
        inline: true,
      }, {
        name: i18n`Standard Deviation`,
        value: `${rivenResult.rerolled.stddev}`,
        inline: true,
      }, {
        name: i18n`Minimum Cost`,
        value: `${rivenResult.rerolled.min}`,
        inline: true,
      }, {
        name: i18n`Maximum Cost`,
        value: `${rivenResult.rerolled.max}`,
        inline: true,
      }, {
        name: i18n`Popularity`,
        value: `${rivenResult.rerolled.pop}`,
        inline: true,
      }, {
        name: i18n`Median Cost`,
        value: `${rivenResult.rerolled.median}`,
        inline: true,
      }]);
    }
    
    if (rivenResult.unrolled && rivenResult.rerolled) {
      this.fields.push({
        name: '\u200B',
        value: '\u200B',
        inline: false,
      });
    }
    
    if(rivenResult.unrolled) {
      this.fields.push(...[{
        name: i18n`Unrolled`,
        value: '\u200B',
        inline: false,
      }, {
        name: i18n`Average Cost`,
        value: `${rivenResult.unrolled.avg}`,
        inline: true,
      }, {
        name: i18n`Standard Deviation`,
        value: `${rivenResult.unrolled.stddev}`,
        inline: true,
      }, {
        name: i18n`Minimum Cost`,
        value: `${rivenResult.unrolled.min}`,
        inline: true,
      }, {
        name: i18n`Maximum Cost`,
        value: `${rivenResult.unrolled.max}`,
        inline: true,
      }, {
        name: i18n`Popularity`,
        value: `${rivenResult.unrolled.pop}`,
        inline: true,
      }, {
        name: i18n`Median Cost`,
        value: `${rivenResult.unrolled.median}`,
        inline: true,
      }]);
    }
    
    if (!this.fields.length) {
      this.description = i18n`No data available`;
    }

    this.title = resultKey;
    this.color = 0x84659F;
    this.type = 'rich';
  }
}

module.exports = RivenStatEmbed;
