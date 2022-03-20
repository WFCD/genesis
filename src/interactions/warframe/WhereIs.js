'use strict';

const Discord = require('discord.js');

const { games, createPagedInteractionCollector } = require('../../CommonFunctions.js');
const { ENDPOINTS } = require('../../resources/WorldStateClient');

function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

const { Constants: { ApplicationCommandOptionTypes: Types } } = Discord;
const queryOpt = [{
  type: Types.STRING,
  name: 'query',
  description: 'What are you looking for?',
  required: true,
}];

const WhereisEmbed = require('../../embeds/WhereisEmbed');
const { createGroupedArray } = require('../../CommonFunctions');

module.exports = class WhereIs extends require('../../models/Interaction') {
  static enabled = games.includes('WARFRAME');

  /**
   * @type {Discord.ApplicationCommandData}
   */
  static command = {
    name: 'whereis',
    description: 'Display where something drops from',
    options: queryOpt,
  };

  /**
   * Handle a discord interaction
   * @param {Discord.CommandInteraction} interaction interaction to handle
   * @param {Object} ctx context object
   * @returns {Promise<*>}
   */
  static async commandHandler(interaction, ctx) {
    // args
    let query = interaction?.options?.get('query')?.value?.toLowerCase();
    const raw = await ctx.ws.search(ENDPOINTS.SEARCH.DROPS, query);
    const data = raw.map((result) => {
      const r = {
        item: result.item,
        rarity: result.rarity,
        chance: `${String(parseFloat(result.chance).toFixed(2)).padEnd(5, '0')}%`,
        chanceNum: parseFloat(result.chance).toFixed(2),
        place: result.place
          .replace('Level ', '')
          .replace(' Orb Vallis Bounty', '')
          .replace(' Cetus Bounty', '')
          .trim(),
      };
      r.place = r.place.split('/')[1] || r.place;
      return r;
    });

    let results = [];

    const map = new Map();
    for (const item of data) {
      const isRelic = item.place.includes('Relic');
      const relic = item.place.split('(')[0].trim();
      if (isRelic && (!map.has(relic) || map.get(relic) < item.chanceNum)) {
        if (map.has(relic)) {
          let indexToRemove;
          results.forEach((urelic, index) => {
            if (urelic.place.includes(relic)) {
              indexToRemove = index;
            }
          });
          if (typeof indexToRemove !== 'undefined') {
            results.splice(indexToRemove, 1);
          }
        }
        map.set(relic, item.chanceNum);
        results.push(item);
      } else if (!isRelic && (!map.has(item.place) || map.get(item.place) < item.chanceNum)) {
        map.set(item.place, item.chanceNum);
        results.push(item);
      }
    }

    results = [...(new Set(results))];
    results.sort((a, b) => b.chanceNum - a.chanceNum);

    const longestName = results.length ? results.map(result => result.item
      .replace('Blueprint', 'BP').replace(' Prime', ' P.'))
      .reduce((a, b) => (a.length > b.length ? a : b)) : '';
    const longestRelic = results.length ? results.map(result => result.place)
      .reduce((a, b) => (a.length > b.length ? a : b)) : '';
    query = toTitleCase(query.trim());

    const relics = createGroupedArray(results, 20)
      .map(rg => new WhereisEmbed(createGroupedArray(rg, 10),
        query,
        longestName.length,
        longestRelic.length))
      .map(e => new Discord.MessageEmbed(e));
    await interaction.deferReply({ ephemeral: ctx.ephemerate });
    return createPagedInteractionCollector(interaction, relics, ctx);
  }
};
