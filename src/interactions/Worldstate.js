'use strict';

const { MessageEmbed } = require('discord.js');

const { timeDeltaToString, games, createGroupedArray, emojify } = require('../CommonFunctions.js');
const logger = require('../Logger');

const platformChoices = require('../resources/platformMap');

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
  arbitration: require('../embeds/ArbitrationEmbed'),
  alerts: require('../embeds/AlertEmbed'),
  cambionCycle: require('../embeds/CambionEmbed'),
  cetusCycle: require('../embeds/EarthCycleEmbed'),
  conclaveChallenges: require('../embeds/ConclaveChallengeEmbed'),
  constructionProgress: require('../embeds/ConstructionEmbed'),
  dailyDeals: require('../embeds/DarvoEmbed'),
  earthCycle: require('../embeds/EarthCycleEmbed'),
  events: require('../embeds/EventEmbed'),
  fissures: require('../embeds/FissureEmbed'),
  invasions: require('../embeds/InvasionEmbed'),
  news: require('../embeds/NewsEmbed'),
  nightwave: require('../embeds/NightwaveEmbed'),
  flashSales: require('../embeds/SalesEmbed'),
  sentientOutposts: require('../embeds/SentientOutpostEmbed'),
  steelPath: require('../embeds/SteelPathEmbed'),
  syndicate: require('../embeds/SyndicateEmbed'),
  vallisCycle: require('../embeds/SolarisEmbed'),
  voidTrader: require('../embeds/VoidTraderEmbed'),
};

const platformable = [{
  type: 'STRING',
  name: 'platform',
  description: 'Platform to check for data',
  choices: platformChoices,
}, {
  type: 'BOOLEAN',
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
  type: 'BOOLEAN',
  name: 'compact',
  description: 'Should all data be in one embed?'
}];

module.exports = class WorldState extends require('../models/Interaction') {
  static enabled = games.includes('WARFRAME');
  
  static command = {
    name: 'ws',
    description: 'Get Warframe Worldstate Information',
    options: [{
      type: 'SUB_COMMAND',
      name: 'alerts',
      description: 'Get WorldState Alerts',
      options: compactable,
    }, {
      type: 'SUB_COMMAND',
      name: 'arbi',
      description: 'Get WorldState Arbitrations',
      options: platformable,
    }, {
      type: 'SUB_COMMAND',
      name: 'baro',
      description: 'Get Current Void Trader Inventory',
      options: platformable,
    }, {
      type: 'SUB_COMMAND',
      name: 'conclave',
      description: 'Get Current Conclave Challenges',
      options: [{
          type: 'STRING',
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
      type: 'SUB_COMMAND',
      name: 'construction',
      description: 'Get Construction Progress',
      options: platformable,
    }, {
      type: 'SUB_COMMAND',
      name: 'cycle',
      description: 'Get current Time Cycle',
      options: [{
          type: 'STRING',
          name: 'place',
          description: 'Where do you want to know about?',
          choices: places,
          required: true
        },
        ...platformable,
      ],
    }, {
      type: 'SUB_COMMAND',
      name: 'darvo',
      description: 'Get Darvo\'s Deals',
      options: platformable,
    }, {
      type: 'SUB_COMMAND',
      name: 'events',
      description: 'Get Active Events',
      options: platformable,
    }, {
      type: 'SUB_COMMAND',
      name: 'fissures',
      description: 'Get WorldState Fissures',
      options: compactable,
    }, {
      type: 'SUB_COMMAND',
      name: 'invasions',
      description: 'Get WorldState Invasions',
      options: compactable,
    }, {
      type: 'SUB_COMMAND',
      name: 'news',
      description: 'Get Current news',
      options: [{
        type: 'STRING',
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
          value: 'stream'
        }],
      }, ...platformable,
      ],
    }, {
      type: 'SUB_COMMAND',
      name: 'nightwave',
      description: 'Get Current Nightwave Challenges',
      options: platformable,
    }, {
      type: 'SUB_COMMAND',
      name: 'sales',
      description: 'Get Current Sales',
      options: platformable,
    }, {
      type: 'SUB_COMMAND',
      name: 'outposts',
      description: 'Get Current Sentient Outposts',
      options: platformable,
    }, {
      type: 'SUB_COMMAND',
      name: 'steelpath',
      description: 'Get Current Steel Path Offerings',
      options: compactable,
    }],
  };
  
  static async commandHandler(interaction, ctx) {
    // args
    const language = ctx.language || 'en';
    const options = interaction.options?.first?.()?.options;
    const platform = options?.get('platform')?.value || ctx.platform || 'pc';
    const compact = options?.get('compact')?.value || false;
    const ephemeral = typeof options?.get('hidden')?.value !== 'undefined'
      ? options?.get('hidden')?.value
      : true;
    
    let category = options?.get('category')?.value || 'all';
    const place = options?.get('place')?.value || false;
    const field = aliases[`${interaction.options?.first()?.name}${place ? `::${place}` : ''}`]
      || interaction.options?.first()?.name
      || null;

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
}