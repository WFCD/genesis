import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import ping from 'ping';

import { cmds } from '#shared/resources/index';
import type { CommandContext } from '#shared/types/context';
import { emojify, games, timeDeltaToString, withEphemeral } from '#shared/utilities/CommonFunctions';

import Interaction from '../../models/Interaction';

const d2Hosts = ['bungie.net', 'api.steampowered.com', 'xbl.io', 'vlkyrie-superi.us', 'status.vlkyrie-superi.us'];
const wfHosts = ['warframe.com', 'api.warframestat.us', 'hub.warframestat.us', 'drops.warframestat.us'];

export default class Ping extends Interaction {
  static enabled = true;

  static command = cmds.ping;

  static async commandHandler(interaction: ChatInputCommandInteraction, ctx: CommandContext) {
    if (!interaction.isChatInputCommand()) return undefined;

    const now = Date.now();
    await interaction.reply(withEphemeral(true, { content: 'Testing Ping' }));
    const afterSend = Date.now();

    const hosts = ['discordapp.com']
      .concat(games.includes('WARFRAME') ? wfHosts : [])
      .concat(games.includes('DESTINY2') ? d2Hosts : []);
    const results = [];
    await Promise.all(
      hosts.map(async (host) => {
        const result = await ping.promise.probe(host);
        results.push({
          name: host,
          value: `${result.alive ? emojify('green_tick') : emojify('red_tick')} ${
            typeof result.time === 'number' ? result.time : '--'
          }ms`,
        });
      })
    );

    results.unshift({
      name: 'Discord WS',
      value: `${emojify('green_tick')} ${interaction.client.ws.ping.toFixed(2)}ms`,
    });
    const updated = new EmbedBuilder({
      title: 'PONG',
      fields: [
        {
          name: ctx.i18n`Response time (shard ${interaction.inGuild() ? interaction.guild.shardId + 1 : 1})`,
          value: `${afterSend - now}ms`,
        },
        ...results,
      ],
      footer: {
        text: `Uptime: ${timeDeltaToString(interaction.client.uptime)}`,
      },
    });
    return interaction.editReply({ content: undefined, embeds: [updated] });
  }
}
