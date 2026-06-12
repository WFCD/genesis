import { ApplicationCommandOptionType as Types } from 'discord.js';

import { games, toTitleCase, withEphemeral } from '#shared/utilities/CommonFunctions';
import WorldStateClient from '#shared/utilities/WorldStateClient';
import { cmds } from '#shared/resources/index';
import type { WhereisRow } from '#shared/embeds/WhereisEmbed';
import WhereisEmbed from '#shared/embeds/WhereisEmbed';

import Interaction from '../../models/Interaction';

import { browseWhereisResults } from './lib/WhereIsBrowse';

const { ENDPOINTS } = WorldStateClient;
const queryOpt = [
  {
    ...cmds.query,
    type: Types.String,
    required: true,
  },
];

export default class WhereIs extends Interaction {
  static enabled = games.includes('WARFRAME');

  static command = {
    ...cmds.whereis,
    options: queryOpt,
  };

  static async commandHandler(interaction, ctx) {
    let query = interaction?.options?.get('query')?.value?.toLowerCase();
    const raw = await ctx.ws.search(ENDPOINTS.SEARCH.DROPS, query);
    const data = raw.map((result) => {
      const r = {
        item: result.item,
        rarity: result.rarity,
        chance: `${String(parseFloat(result.chance).toFixed(2)).padEnd(5, '0')}%`,
        chanceNum: parseFloat(result.chance),
        place: result.place.replace('Level ', '').replace(' Orb Vallis Bounty', '').replace(' Cetus Bounty', '').trim(),
      };
      r.place = r.place.split('/')[1] || r.place;
      return r;
    });

    let results: WhereisRow[] = [];

    const map = new Map<string, number>();
    data.forEach((item) => {
      const isRelic = item.place.includes('Relic');
      const relic = item.place.split('(')[0].trim();
      if (isRelic && (!map.has(relic) || map.get(relic)! < item.chanceNum)) {
        if (map.has(relic)) {
          const indexToRemove = results.findIndex((urelic) => urelic.place.includes(relic));
          if (indexToRemove >= 0) results.splice(indexToRemove, 1);
        }
        map.set(relic, item.chanceNum);
        results.push(item);
      } else if (!isRelic && (!map.has(item.place) || map.get(item.place)! < item.chanceNum)) {
        map.set(item.place, item.chanceNum);
        results.push(item);
      }
    });

    results = [...new Set(results)];
    query = toTitleCase(query.trim());

    await interaction.deferReply(withEphemeral(ctx.ephemerate));

    if (!results.length) {
      return interaction.editReply(withEphemeral(ctx.ephemerate, { embeds: [new WhereisEmbed([], query)] }));
    }

    return browseWhereisResults(interaction, ctx, results, query);
  }
}
