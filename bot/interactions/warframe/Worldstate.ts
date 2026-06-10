import { ApplicationCommandOptionType as Types, EmbedBuilder } from 'discord.js';

import Collectors from '#shared/utilities/Collectors';
import { createGroupedArray, emojify, games, withEphemeral } from '#shared/utilities/CommonFunctions';
import Alert from '#shared/embeds/AlertEmbed';
import Arbitration from '#shared/embeds/ArbitrationEmbed';
import Cambion from '#shared/embeds/CambionEmbed';
import Conclave from '#shared/embeds/ConclaveChallengeEmbed';
import Construction from '#shared/embeds/ConstructionEmbed';
import Cycle from '#shared/embeds/EarthCycleEmbed';
import Darvo from '#shared/embeds/DarvoEmbed';
import Duviri from '#shared/embeds/DuviriEmbed';
import Event from '#shared/embeds/EventEmbed';
import Fissure from '#shared/embeds/FissureEmbed';
import Invasion from '#shared/embeds/InvasionEmbed';
import News from '#shared/embeds/NewsEmbed';
import Sales from '#shared/embeds/SalesEmbed';
import Sortie from '#shared/embeds/SortieEmbed';
import Syndicate, { expandSyndicateMissionPages } from '#shared/embeds/SyndicateEmbed';
import VoidTrader from '#shared/embeds/VoidTraderEmbed';
import Solaris from '#shared/embeds/SolarisEmbed';
import Nightwave from '#shared/embeds/NightwaveEmbed';
import Outposts from '#shared/embeds/SentientOutpostEmbed';
import SteelPath from '#shared/embeds/SteelPathEmbed';
import { cmds, platformMap as platformChoices, syndicates as syndicateOptions } from '#shared/resources/index';
import { isActive, isActiveArbitration } from '#shared/utilities/WorldState';

import Interaction from '../../models/Interaction';

import { replyDarvoDeal } from './lib/DarvoDealReply';

const aliases = {
  arbi: 'arbitration',
  baro: 'voidTrader',
  'cycle::cetus': 'cetusCycle',
  'cycle::earth': 'earthCycle',
  'cycle::cambion': 'cambionCycle',
  'cycle::vallis': 'vallisCycle',
  'cycle::duviri': 'duviriCycle',
  conclave: 'conclaveChallenges',
  construction: 'constructionProgress',
  darvo: 'dailyDeals',
  outposts: 'sentientOutposts',
  sales: 'flashSales',
  steelpath: 'steelPath',
  archons: 'archonHunt',
  syndicate: 'syndicateMissions',
};
const embeds = {
  arbitration: Arbitration,
  alerts: Alert,
  archonHunt: Sortie,
  cambionCycle: Cambion,
  duviriCycle: Duviri,
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
    type: Types.String,
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
  {
    name: 'Duviri',
    value: 'duviri',
  },
];
const syndicates = syndicateOptions.map((s) => ({
  name: s.display,
  value: s.display,
}));
const compactable = [
  ...platformable,
  {
    type: Types.Boolean,
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
      ...cmds.archons,
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
          type: Types.String,
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
          type: Types.String,
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
          type: Types.String,
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
    {
      ...cmds.syndicate,
      options: [
        {
          type: Types.String,
          name: 'syndicate',
          description: 'Which syndicate?',
          required: true,
          choices: syndicates,
        },
        ...platformable,
      ],
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

    const category = options?.get?.('category')?.value || 'all';
    const place = options?.get?.('place')?.value;
    const syndicate = options?.get?.('syndicate')?.value;

    const key = `${subcommand}${place ? `::${place}` : ''}`;
    const field = aliases[key] || subcommand || undefined;

    // validation
    if (!field) {
      return interaction.reply(ctx.i18n`No field`);
    }

    await interaction.deferReply(withEphemeral(ephemeral));
    let data;

    try {
      data = await ctx.ws.get(String(field), platform, language);
    } catch (e) {
      return interaction.editReply(ctx.i18n`${emojify('red_tick')} Failed to obtain data, sorry`);
    }
    let pages;
    let embed;
    if (Array.isArray(data) && !data.length) return interaction.editReply(ctx.i18n`⚠️ No ${field} active.`);
    switch (field) {
      case 'fissures':
        if (!compact) {
          pages = [];
          const eras = data.reduce((groups, fissure) => {
            const key = fissure.tier.toLowerCase();
            groups[key] ??= [];
            groups[key].push(fissure);
            return groups;
          }, {});

          Object.keys(eras)
            .sort((a, b) => (eras[a][0]?.tierNum ?? 0) - (eras[b][0]?.tierNum ?? 0))
            .forEach((eraKey) => {
              if (!eras[eraKey].length) return;
              pages.push(
                new embeds.fissures(eras[eraKey], {
                  platform,
                  i18n: ctx.i18n,
                  era: eras[eraKey][0]?.tier,
                })
              );
            });
          return Collectors.dynamic(interaction, pages, ctx);
        }
        if (!data?.length) {
          return interaction.editReply(ctx.i18n`⚠️ No ${field} active.`);
        }
        pages = createGroupedArray(data, 25).map(
          (group) => new Fissure(group, { platform, i18n: ctx.i18n, locale: language })
        );
        if (pages.length === 1) {
          return interaction.editReply({ embeds: [new EmbedBuilder(pages[0])] });
        }
        return Collectors.dynamic(interaction, pages, ctx);
      case 'invasions': {
        if (!data?.length) {
          return interaction.editReply(ctx.i18n`⚠️ No invasions active.`);
        }
        if (!compact) {
          pages = data.map((a) => new Invasion(a, { i18n: ctx.i18n, locale: language }));
          if (pages.length === 1) {
            return interaction.editReply({ embeds: [new EmbedBuilder(pages[0])] });
          }
          return Collectors.paged(interaction, pages, ctx);
        }
        pages = createGroupedArray(data, 25).map((group) => new Invasion(group, { i18n: ctx.i18n, locale: language }));
        if (pages.length === 1) {
          return interaction.editReply({ embeds: [new EmbedBuilder(pages[0])] });
        }
        return Collectors.paged(interaction, pages, ctx);
      }
      case 'alerts':
        if (!compact) {
          return Collectors.dynamic(
            interaction,
            data.map((a) => new embeds.alerts(a, { platform, i18n: ctx.i18n })),
            ctx
          );
        }
        if (!data?.length) {
          return interaction.editReply(ctx.i18n`⚠️ No alerts active.`);
        }
        pages = createGroupedArray(data, 25).map(
          (group) => new Alert(group, { platform, i18n: ctx.i18n, locale: language })
        );
        if (pages.length === 1) {
          return interaction.editReply({ embeds: [new EmbedBuilder(pages[0])] });
        }
        return Collectors.paged(interaction, pages, ctx);
      case 'dailyDeals': {
        if (!data?.length) {
          return interaction.editReply(ctx.i18n`No Daily Deals Active`);
        }
        return replyDarvoDeal(interaction, data[0], ctx, { platform, language, ephemeral });
      }
      case 'arbitration': {
        if (!isActiveArbitration(data)) {
          return interaction.editReply(ctx.i18n`⚠️ No arbitration active.`);
        }
        embed = EmbedBuilder.from(new embeds.arbitration(data, { platform, i18n: ctx.i18n, locale: language }));
        return interaction.editReply({ embeds: [embed] });
      }
      case 'archonHunt':
      case 'earthCycle':
      case 'cetusCycle':
      case 'vallisCycle':
      case 'cambionCycle':
      case 'duviriCycle':
      case 'constructionProgress':
      case 'nightwave':
      case 'sortie':
      case 'sentientOutposts':
        if (!data?.length && !Object.keys(data).length) {
          return interaction.editReply(ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`);
        }
        embed = new EmbedBuilder(new embeds[field](data, { platform, i18n: ctx.i18n }));
        return interaction.editReply({ embeds: [embed] });
      case 'voidTrader': {
        if (!data || !Object.keys(data).length) {
          return interaction.editReply(ctx.i18n`No Void Trader Active`);
        }
        const baroEmbed = new embeds.voidTrader(data, {
          platform,
          onDemand: true,
          i18n: ctx.i18n,
          locale: language,
        });
        const fields = baroEmbed.data.fields ?? [];

        if (fields.length <= 15) {
          return interaction.editReply({ embeds: [EmbedBuilder.from(baroEmbed)] });
        }

        pages = createGroupedArray(fields, 15).map((fieldGroup) => {
          const page = EmbedBuilder.from(baroEmbed);
          page.setFields(fieldGroup);
          return page;
        });
        return Collectors.paged(interaction, pages, ctx);
      }
      case 'news': {
        const newsType =
          !category || category === 'news' || category === 'all'
            ? undefined
            : category === 'updates'
              ? 'update'
              : category;
        if (!data?.length) {
          return interaction.editReply(ctx.i18n`No News Active`);
        }
        pages = createGroupedArray(data, 20).map(
          (group) => new News(group, { type: newsType, platform, i18n: ctx.i18n, locale: language })
        );
        return interaction.editReply({ embeds: pages });
      }
      case 'conclaveChallenges':
        if (!data.length && !Object.keys(data).length) {
          return interaction.editReply(ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`);
        }
        pages = createGroupedArray(data, 20).map(
          (group) => new embeds.conclaveChallenges(group, { category, platform, i18n: ctx.i18n, locale: language })
        );
        return interaction.editReply({ embeds: pages });
      case 'events':
        if (!data.length && !Object.keys(data).length) {
          return interaction.editReply(ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`);
        }
        pages = data.map((datum) => new EmbedBuilder(new embeds[field](datum, { platform, i18n: ctx.i18n })));
        return interaction.editReply({ embeds: pages });
      case 'steelPath':
        if (!data.length && !Object.keys(data).length) {
          return interaction.editReply(ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`);
        }
        embed = new embeds[field](data, { isCommand: true, i18n: ctx.i18n });
        return interaction.editReply({ embeds: [embed] });
      case 'flashSales': {
        if (!data?.length) {
          return interaction.editReply(ctx.i18n`No Flash Sales Active`);
        }
        const active = data.filter((sale) => isActive(sale));
        const groups = [active.filter((sale) => sale.isFeatured), active.filter((sale) => sale.isPopular)].filter(
          (group) => group.length
        );
        if (!groups.length) {
          const discounted = active.filter((sale) => (sale.discount ?? 0) > 0);
          if (discounted.length) groups.push(discounted);
        }
        if (!groups.length) {
          return interaction.editReply(ctx.i18n`⚠️ No sales active.`);
        }
        pages = groups.flatMap((group) =>
          createGroupedArray(group, 25).map((chunk) => new Sales(chunk, { platform, i18n: ctx.i18n, locale: language }))
        );
        if (pages.length === 1) {
          return interaction.editReply({ embeds: [new EmbedBuilder(pages[0])] });
        }
        return Collectors.dynamic(interaction, pages, ctx);
      }
      case 'syndicateMissions': {
        const hasSyndicateContent = (mission) => (mission.jobs?.length ?? 0) > 0 || (mission.nodes?.length ?? 0) > 0;
        const missions = data?.filter(
          (m) => (syndicate === 'all' || m.syndicate === syndicate) && hasSyndicateContent(m)
        );
        if (!missions?.length) {
          return interaction.editReply(ctx.i18n`⚠️ No syndicate missions active.`);
        }
        pages = expandSyndicateMissionPages(missions)
          .map(
            (mission) =>
              new Syndicate([mission], {
                syndicate: mission.syndicate,
                skipCheck: true,
                i18n: ctx.i18n,
                platform,
                locale: ctx.language,
              })
          )
          .filter((p) => p.title);
        if (!pages.length) {
          return interaction.editReply(ctx.i18n`⚠️ No syndicate missions active.`);
        }
        return Collectors.dynamic(interaction, pages, ctx);
      }
      default:
        break;
    }
    return interaction.replied || interaction.deferred
      ? false
      : interaction.reply(withEphemeral(true, { content: 'got it' }));
  }
}
