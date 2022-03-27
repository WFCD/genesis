import { MessageEmbed } from 'discord.js';
import ping from 'ping';
import { emojify, games, timeDeltaToString } from '../../utilities/CommonFunctions.js';
import Interaction from '../../models/Interaction.js';

const d2Hosts = [
  'bungie.net',
  'api.steampowered.com',
  'xbl.io',
  'vlkyrie-superi.us',
  'status.vlkyrie-superi.us',
];
const wfHosts = [
  'warframe.com',
  'api.warframestat.us',
  'hub.warframestat.us',
  'drops.warframestat.us',
];

export default class Ping extends Interaction {
  static enabled = true;

  static command = {
    name: 'ping',
    description: 'ping some stuff',
    // defaultPermission: false,
  };

  static async commandHandler(interaction, ctx) {
    if (!interaction.isCommand()) return;

    const now = Date.now();
    await interaction.reply({ content: 'Testing Ping', ephemeral: true });
    const afterSend = Date.now();

    const hosts = ['discordapp.com']
      .concat(games.includes('WARFRAME') ? wfHosts : [])
      .concat(games.includes('DESTINY2') ? d2Hosts : []);
    const results = [];
    await Promise.all(hosts.map(async (host) => {
      const result = await ping.promise.probe(host);
      results.push({
        name: host,
        value: `${result.alive ? emojify('green_tick') : emojify('red_tick')} ${typeof result.time !== 'undefined' && result.time !== 'unknown' ? result.time : '--'}ms`,
      });
    }));

    results.unshift({
      name: 'Discord WS',
      value: `${emojify('green_tick')} ${interaction.client.ws.ping.toFixed(2)}ms`,
    });
    const updated = new MessageEmbed({
      title: 'PONG',
      type: 'rich',
      fields: [{
        name: ctx.i18n`Response time (shard ${interaction.inGuild() ? interaction.guild.shardId + 1 : 1})`,
        value: `${afterSend - now}ms`,
      },
      ...results,
      ],
      footer: {
        thumbnail_url: '\u200B',
        text: `Uptime: ${timeDeltaToString(interaction.client.uptime)}`,
      },
    });
    return interaction.editReply({ content: undefined, embeds: [updated] });
  }
}
