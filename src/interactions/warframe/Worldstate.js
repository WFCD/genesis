'use strict';

const { Constants: { ApplicationCommandOptionTypes: Types } } = require('discord.js');

const {
  games, createGroupedArray,
} = require('../../CommonFunctions.js');

const platformChoices = require('../../resources/platformMap');

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

const embedsd = '../../embeds';

/* eslint-disable import/no-dynamic-require */
const embeds = {
  arbitration: require(`${embedsd}/ArbitrationEmbed`),
  alerts: require(`${embedsd}/AlertEmbed`),
  cambionCycle: require(`${embedsd}/CambionEmbed`),
  cetusCycle: require(`${embedsd}/EarthCycleEmbed`),
  conclaveChallenges: require(`${embedsd}/ConclaveChallengeEmbed`),
  constructionProgress: require(`${embedsd}/ConstructionEmbed`),
  dailyDeals: require(`${embedsd}/DarvoEmbed`),
  earthCycle: require(`${embedsd}/EarthCycleEmbed`),
  events: require(`${embedsd}/EventEmbed`),
  fissures: require(`${embedsd}/FissureEmbed`),
  invasions: require(`${embedsd}/InvasionEmbed`),
  news: require(`${embedsd}/NewsEmbed`),
  nightwave: require(`${embedsd}/NightwaveEmbed`),
  flashSales: require(`${embedsd}/SalesEmbed`),
  sentientOutposts: require(`${embedsd}/SentientOutpostEmbed`),
  steelPath: require(`${embedsd}/SteelPathEmbed`),
  syndicate: require(`${embedsd}/SyndicateEmbed`),
  vallisCycle: require(`${embedsd}/SolarisEmbed`),
  voidTrader: require(`${embedsd}/VoidTraderEmbed`),
};

const platformable = [{
  type: Types.STRING,
  name: 'platform',
  description: 'Platform to check for data',
  choices: platformChoices,
}, {
  type: Types.BOOLEAN,
  name: 'hidden',
  description: 'Should the response be hidden from others?',
}];

const places = [{
  name: 'Earth',
  value: 'earth',
}, {
  name: 'Cetus',
  value: 'cetus',
}, {
  name: 'Orb Vallis',
  value: 'vallis',
}, {
  name: 'Cambion Drift',
  value: 'cambion',
}];

const compactable = [...platformable, {
  type: Types.BOOLEAN,
  name: 'compact',
  description: 'Should all data be in one embed?',
}];

module.exports = class WorldState extends require('../../models/Interaction') {
  static enabled = games.includes('WARFRAME');

  static command = {
    name: 'ws',
    description: 'Get Warframe Worldstate Information',
    options: [{
      type: Types.SUB_COMMAND,
      name: 'alerts',
      description: 'Get WorldState Alerts',
      options: compactable,
    }, {
      type: Types.SUB_COMMAND,
      name: 'arbi',
      description: 'Get WorldState Arbitrations',
      options: platformable,
    }, {
      type: Types.SUB_COMMAND,
      name: 'baro',
      description: 'Get Current Void Trader Inventory',
      options: platformable,
    }, {
      type: Types.SUB_COMMAND,
      name: 'conclave',
      description: 'Get Current Conclave Challenges',
      options: [{
        type: Types.STRING,
        name: 'category',
        description: 'Which conclave challenge category?',
        choices: [{
          name: 'All',
          value: 'all',
        }, {
          name: 'Daily',
          value: 'day',
        }, {
          name: 'Weekly',
          value: 'week',
        }],
      },
      ...platformable,
      ],
    }, {
      type: Types.SUB_COMMAND,
      name: 'construction',
      description: 'Get Construction Progress',
      options: platformable,
    }, {
      type: Types.SUB_COMMAND,
      name: 'cycle',
      description: 'Get current Time Cycle',
      options: [{
        type: Types.STRING,
        name: 'place',
        description: 'Where do you want to know about?',
        choices: places,
        required: true,
      },
      ...platformable,
      ],
    }, {
      type: Types.SUB_COMMAND,
      name: 'darvo',
      description: 'Get Darvo\'s Deals',
      options: platformable,
    }, {
      type: Types.SUB_COMMAND,
      name: 'events',
      description: 'Get Active Events',
      options: platformable,
    }, {
      type: Types.SUB_COMMAND,
      name: 'fissures',
      description: 'Get WorldState Fissures',
      options: compactable,
    }, {
      type: Types.SUB_COMMAND,
      name: 'invasions',
      description: 'Get WorldState Invasions',
      options: compactable,
    }, {
      type: Types.SUB_COMMAND,
      name: 'news',
      description: 'Get Current news',
      options: [{
        type: Types.STRING,
        name: 'category',
        description: 'Which news do you want?',
        required: true,
        choices: [{
          name: 'General News (All)',
          value: 'news',
        }, {
          name: 'Updates',
          value: 'updates',
        }, {
          name: 'Prime Access',
          value: 'primeaccess',
        }, {
          name: 'Streams',
          value: 'stream',
        }],
      }, ...platformable,
      ],
    }, {
      type: Types.SUB_COMMAND,
      name: 'nightwave',
      description: 'Get Current Nightwave Challenges',
      options: platformable,
    }, {
      type: Types.SUB_COMMAND,
      name: 'sales',
      description: 'Get Current Sales',
      options: platformable,
    }, {
      type: Types.SUB_COMMAND,
      name: 'outposts',
      description: 'Get Current Sentient Outposts',
      options: platformable,
    }, {
      type: Types.SUB_COMMAND,
      name: 'steelpath',
      description: 'Get Current Steel Path Offerings',
      options: compactable,
    }],
  };

  static async commandHandler(interaction, ctx) {
    // args
    const language = ctx.language || 'en';
    const subcommand = interaction.options.first();
    const options = subcommand?.options;
    const platform = options?.get?.('platform')?.value || ctx.platform || 'pc';
    // const compact = options?.get?.('compact')?.value || false;
    const ephemeral = typeof options?.get?.('hidden')?.value !== 'undefined'
      ? options?.get?.('hidden')?.value
      : true;

    let category = options?.get?.('category')?.value || 'all';
    const place = options?.get?.('place')?.value;

    const key = `${subcommand?.name}${place ? `::${place}` : ''}`;
    const field = aliases[key] || subcommand?.name || null;

    // validation
    if (!field) {
      return interaction.reply(ctx.i18n`No field`);
    }

    await interaction.defer({ ephemeral });
    const data = await ctx.ws.get(String(field), platform, language);

    switch (field) {
      case 'alerts':
      case 'fissures':
      case 'invasions':
      case 'arbitration':
      case 'earthCycle':
      case 'cetusCycle':
      case 'vallisCycle':
      case 'cambionCycle':
      case 'voidTrader':
      case 'dailyDeals':
      case 'constructionProgress':
      case 'nightwave':
      case 'sentientOutposts':
        if (!data.length && !Object.keys(data).length) {
          interaction.editReply({ content: ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`, ephemeral: true });
        } else {
          const embed = new embeds[field](null, data, platform, ctx.i18n);
          interaction.editReply({ ephemeral, embeds: [embed] });
        }
        break;
      case 'news':
        category = category === 'news' ? null : category;
      case 'conclaveChallenges':
        if (!data.length && !Object.keys(data).length) {
          interaction.editReply({ content: ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`, ephemeral: true });
        } else {
          const pages = createGroupedArray(data, 20)
            .map(group => new embeds[field](null, group, category, platform, ctx.i18n));
          interaction.editReply({ ephemeral, embeds: pages });
        }
        break;
      case 'events':
        if (!data.length && !Object.keys(data).length) {
          interaction.editReply({ content: ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`, ephemeral: true });
        } else {
          const pages = data.map(datum => new embeds[field](null, datum, platform, ctx.i18n));
          interaction.editReply({ ephemeral, embeds: pages });
        }
        break;
      case 'steelPath':
        if (!data.length && !Object.keys(data).length) {
          interaction.editReply({ content: ctx.i18n`No ${field.charAt(0).toUpperCase() + field.slice(1)} Active`, ephemeral: true });
        } else {
          const embed = new embeds[field](null, data, ctx);
          interaction.editReply({ ephemeral, embeds: [embed] });
        }
        break;
      default:
        break;
    }
    return interaction.replied || interaction.deferred
      ? false
      : interaction.reply({ content: 'got it', ephemeral: true });
  }
};
