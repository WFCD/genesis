import { Constants, MessageEmbed } from 'discord.js';
import Collectors from '../../utilities/Collectors.js';
import { createGroupedArray, games } from '../../utilities/CommonFunctions.js';
import Interaction from '../../models/Interaction.js';
import Alert from '../../embeds/AlertEmbed.js';
import Arbitration from '../../embeds/ArbitrationEmbed.js';
import Cambion from '../../embeds/CambionEmbed.js';
import Conclave from '../../embeds/ConclaveChallengeEmbed.js';
import Construction from '../../embeds/ConstructionEmbed.js';
import Cycle from '../../embeds/EarthCycleEmbed.js';
import Darvo from '../../embeds/DarvoEmbed.js';
import Event from '../../embeds/EventEmbed.js';
import Fissure from '../../embeds/FissureEmbed.js';
import Invasion from '../../embeds/InvasionEmbed.js';
import News from '../../embeds/NewsEmbed.js';
import Sales from '../../embeds/SalesEmbed.js';
import Sortie from '../../embeds/SortieEmbed.js';
import Syndicate from '../../embeds/SyndicateEmbed.js';
import VoidTrader from '../../embeds/VoidTraderEmbed.js';
import Solaris from '../../embeds/SolarisEmbed.js';
import Nightwave from '../../embeds/NightwaveEmbed.js';
import Outposts from '../../embeds/SentientOutpostEmbed.js';
import SteelPath from '../../embeds/SteelPathEmbed.js';
import { cmds, platformMap as platformChoices } from '../../resources/index.js';

const { ApplicationCommandOptionTypes: Types } = Constants;

const aliases = {
  arbi: 'arbitration',
  baro: 'voidTrader',
  'cycle::cetus': 'cetusCycle',
  'cycle::earth': 'earthCycle',
  'cycle::cambion': 'cambionCycle',
  'cycle::vallis': 'vallisCycle',
  conclave: 'conclaveChallenges',
  construction: 'constructionProgress',
  darvo: 'dailyDeals',
  outposts: 'sentientOutposts',
  sales: 'flashSales',
  steelpath: 'steelPath',
};
const embeds = {
  arbitration: Arbitration,
  alerts: Alert,
  cambionCycle: Cambion,
  cetusCycle: Cycle,
  conclaveChallenges: Conclave,
  constructionProgress: Construction,
  dailyDeals: Darvo,
  earthCycle: Cycle,
  events: Event,
  fissures: Fissure,
  invasions: Invasion,
  news: News,
  nightwave: Nightwave,
  flashSales: Sales,
  sentientOutposts: Outposts,
  steelPath: SteelPath,
  syndicate: Syndicate,
  vallisCycle: Solaris,
  voidTrader: VoidTrader,
  sortie: Sortie,
};
const platformable = [
  {
    type: Types.STRING,
    name: 'platform',
    description: 'Platform to check for data',
    choices: platformChoices,
  },
];
const places = [
  {
    name: 'Earth',
    value: 'earth',
  },
  {
    name: 'Cetus',
    value: 'cetus',
  },
  {
    name: 'Orb Vallis',
    value: 'vallis',
  },
  {
    name: 'Cambion Drift',
    value: 'cambion',
  },
];
const compactable = [
  ...platformable,
  {
    type: Types.BOOLEAN,
    name: 'compact',
    description: 'Should all data be in one embed?',
  },
];

export default class WorldState extends Interaction {
  static enabled = games.includes('WARFRAME');
  static command = undefined;

  static commands = [
    {
      ...cmds.alerts,
      options: compactable,
    },
    {
      ...cmds.arbi,
      options: platformable,
    },
    {
      ...cmds.baro,
      options: platformable,
    },
    {
      ...cmds.conclave,
      options: [
        {
          type: Types.STRING,
          name: 'category',
          description: 'Which conclave challenge category?',
          choices: [
            {
              name: 'All',
              value: 'all',
            },
            {
              name: 'Daily',
              value: 'day',
            },
            {
              name: 'Weekly',
              value: 'week',
            },
          ],
        },
        ...platformable,
      ],
    },
    {
      ...cmds.construction,
      options: platformable,
    },
    {
      ...cmds.cycle,
      options: [
        {
          type: Types.STRING,
          name: 'place',
          description: 'Where do you want to know about?',
          choices: places,
          required: true,
        },
        ...platformable,
      ],
    },
    {
      ...cmds.darvo,
      options: platformable,
    },
    {
      ...cmds.events,
      options: platformable,
    },
    {
      ...cmds.fissures,
      options: compactable,
    },
    {
      ...cmds.invasions,
      options: compactable,
    },
    {
      ...cmds.news,
      options: [
        {
          type: Types.STRING,
          name: 'category',
          description: 'Which news do you want?',
          required: true,
          choices: [
            {
              name: 'General News (All)',
              value: 'news',
            },
            {
              name: 'Updates',
              value: 'updates',
            },
            {
              name: 'Prime Access',
              value: 'primeaccess',
            },
            {
              name: 'Streams',
              value: 'stream',
            },
          ],
        },
        ...platformable,
      ],
    },
    {
      ...cmds.nightwave,
      options: platformable,
    },
    {
      ...cmds.sales,
      options: platformable,
    },
    {
      ...cmds.outposts,
      options: platformable,
    },
    {
      ...cmds.steelpath,
      options: platformable,
    },
    {
      ...cmds.sortie,
      options: platformable,
    },
  ];

  static async commandHandler(interaction, ctx) {
    // args
    const language = ctx.language || 'en';
    const subcommand = interaction.commandName;
    const { options } = interaction;
    const platform = options?.getString('platform', false) || ctx.platform || 'pc';
    const compact = options?.getBoolean?.('compact', false);
    const ephemeral = ctx.ephemerate;

    let category = options?.get?.('category')?.value || 'all';
    const place = options?.get?.('place')?.value;

    const key = `${subcommand}${place ? `::${place}` : ''}`;
    const field = aliases[key] || subcommand || undefined;

    // validation
    if (!field) {
      return interaction.reply(ctx.i18n`No field`);
    }

    await interaction.deferReply({ ephemeral });
    const data = await ctx.ws.get(String(field), platform, language);
    let pages;
    let embed;
    if (Array.isArray(data) && !data.length) return interaction.editReply(ctx.i18n`⚠️ No ${field} active.`);
    switch (field) {
      case 'fissures':
        if (!compact) {
          pages = [];
          const eras = {
            lith: [],
            meso: [],
            neo: [],
            axi: [],
            requiem: [],
          };

          data.forEach((fissure) => {
            eras?.[fissure.tier.toLowerCase()]?.push(fissure);
          });

          Object.keys(eras).forEach((eraKey) => {
            pages.push(
              // eslint-disable-next-line new-cap
              new embeds.fissures(eras[eraKey], {
                platform,
                i18n: ctx.i18n,
                era: eras[eraKey][0].tier,
              })
            );
          });
          return Collectors.dynamic(interaction, pages, ctx);
        }
      case 'alerts':
      case 'invasions':
        if (!compact) {
          return Collectors.dynamic(
            interaction,
            // eslint-disable-next-line new-cap
            data.map((a) => new embeds[field](a, { platform, i18n: ctx.i18n })),
            ctx
          );
        }
      case 'arbitration':
      case 'earthCycle':
      case 'cetusCycle':
      case 'vallisCycle':
      case 'cambionCycle':
      case 'dailyDeals':
      case 'constructionProgress':
      case 'nightwave':
      case 'sortie':
      case 'sentientOutposts':
        if (!data.length && !Object.keys(data).length) {
          return interaction.editReply(ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`);
        }
        embed = new MessageEmbed(new embeds[field](data, { platform, i18n: ctx.i18n }));
        return interaction.editReply({ embeds: [embed] });
      case 'voidTrader':
        if (!data.length && !Object.keys(data).length) {
          return interaction.editReply(ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`);
        }
        embed = new MessageEmbed(
          new embeds[field](data, {
            platform,
            onDemand: true,
            i18n: ctx.i18n,
          })
        );
        pages = createGroupedArray(embed.fields, 15).map((fieldGroup) => {
          const tembed = { ...embed };
          tembed.fields = fieldGroup;
          return tembed;
        });
        return interaction.editReply({ embeds: pages });
      case 'news':
        category = category === 'news' ? undefined : category;
      case 'conclaveChallenges':
        if (!data.length && !Object.keys(data).length) {
          return interaction.editReply(ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`);
        }
        pages = createGroupedArray(data, 20).map(
          (group) => new embeds[field](group, { category, platform, i18n: ctx.i18n })
        );
        return interaction.editReply({ embeds: pages });
      case 'events':
        if (!data.length && !Object.keys(data).length) {
          return interaction.editReply(ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`);
        }
        pages = data.map((datum) => new MessageEmbed(new embeds[field](datum, { platform, i18n: ctx.i18n })));
        return interaction.editReply({ embeds: pages });
      case 'steelPath':
        if (!data.length && !Object.keys(data).length) {
          return interaction.editReply(ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`);
        }
        embed = new embeds[field](data, { isCommand: true, i18n: ctx.i18n });
        return interaction.editReply({ embeds: [embed] });
      default:
        break;
    }
    return interaction.replied || interaction.deferred
      ? false
      : interaction.reply({ content: 'got it', ephemeral: true });
  }
}
