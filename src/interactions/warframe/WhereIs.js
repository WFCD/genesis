import Discord, { ApplicationCommandOptionType } from 'discord.js';

import WhereisEmbed from '../../embeds/WhereisEmbed.js';
import Collectors from '../../utilities/Collectors.js';
import { createGroupedArray, games, toTitleCase } from '../../utilities/CommonFunctions.js';
import WorldStateClient from '../../utilities/WorldStateClient.js';
import Interaction from '../../models/Interaction.js';
import { cmds } from '../../resources/index.js';

const { ENDPOINTS } = WorldStateClient;
const queryOpt = [
  {
    ...cmds.query,
    type: ApplicationCommandOptionType.String,
    required: true,
  },
];

export default class WhereIs extends Interaction {
  static enabled = games.includes('WARFRAME');

  /**
   * @type {Discord.ApplicationCommandData}
   */
  static command = {
    ...cmds.whereis,
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
        place: result.place.replace('Level ', '').replace(' Orb Vallis Bounty', '').replace(' Cetus Bounty', '').trim(),
      };
      r.place = r.place.split('/')[1] || r.place;
      return r;
    });

    let results = [];

    const map = new Map();
    await Promise.all(
      data.map(async (item) => {
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
      })
    );

    results = [...new Set(results)];
    results.sort((a, b) => b.chanceNum - a.chanceNum);

    const longestName = results.length
      ? results
          .map((result) => result.item.replace('Blueprint', 'BP').replace(' Prime', ' P.'))
          .reduce((a, b) => (a.length > b.length ? a : b))
      : '';
    const longestRelic = results.length
      ? results.map((result) => result.place).reduce((a, b) => (a.length > b.length ? a : b))
      : '';
    query = toTitleCase(query.trim());

    const relics = createGroupedArray(results, 20)
      .map((rg) => new WhereisEmbed(createGroupedArray(rg, 10), query, longestName.length, longestRelic.length))
      .map((e) => new Discord.EmbedBuilder(e));
    await interaction.deferReply({ flags: ctx.ephemerate ? this.MessageFlags.Ephemeral : 0 });
    return Collectors.paged(interaction, relics, ctx);
  }
}
