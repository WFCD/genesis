'use strict';

const BaseEmbed = require('./BaseEmbed.js');
const { emojify, assetBase } = require('../CommonFunctions');

/**
 * Generates enemy embeds
 */
class FrameEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Warframe} frame - The enhancement to send info on
   * @param {Array.<Warframe>} frames - List of available warframes
   */
  constructor(bot, frame, frames) {
    super();

    this.thumbnail = {
      url: `${assetBase}/img/arcane.png`,
    };
    if (frame && typeof frame !== 'undefined') {
      this.title = frame.name;
      this.url = frame.wikiaUrl;
      this.thumbnail.url = frame.wikiaThumbnail;
      this.description = `_${frame.description}_`;
      if (frame.location) {
        this.footer = { text: `Drops from: ${frame.location}` };
      }
      this.color = frame.color;
      this.fields = [
        (frame.url || frame.prime_url) ? {
          name: 'Profile',
          value: `[Frame Profile](${frame.url})${frame.prime_url ? `\n[Prime Intro](${frame.prime_url})` : ''}`,
          inline: false,
        } : false,
        frame.passiveDescription ? {
          name: 'Passive',
          value: `_${frame.passiveDescription}_`,
        } : false,
        {
          name: 'Minimum Mastery',
          value: `${frame.masteryReq || 'Unranked'} ${emojify('mastery_rank')}`,
          inline: true,
        },
        {
          name: 'Health',
          value: frame.health || 'N/A',
          inline: true,
        },
        {
          name: 'Shields',
          value: frame.shield || 'N/A',
          inline: true,
        },
        {
          name: 'Armor',
          value: frame.armor || 'N/A',
          inline: true,
        },
        {
          name: 'Power',
          value: frame.power || 'N/A',
          inline: true,
        },
        {
          name: 'Conclave',
          value: emojify((frame.conclave ? 'green_tick' : 'red_tick') || 'N/A'),
          inline: true,
        },
        {
          name: 'Aura',
          value: emojify(frame.aura || 'No Aura'),
          inline: true,
        },
        {
          name: 'Polarities',
          value: emojify(frame.polarities && frame.polarities.length > 0 ? frame.polarities.join(' ') : 'No polarities'),
          inline: true,
        },
        { // this is coming out too long, needs to be chunked
          name: 'Abilities',
          value: '**=============**',
        },
      ];

      this.fields.push(...(frame?.abilities?.map(ability => ({ name: ability.name, value: `_${ability.description}_` })) || []));
      this.fields = this.fields.filter(field => field && field?.value?.length);
    } else {
      this.title = 'Available Warframes';
      this.fields = [{ name: '\u200B', value: frames.map(stat => stat.name).join('\n') }];
    }
  }
}

module.exports = FrameEmbed;
