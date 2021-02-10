'use strict';

/* eslint-disable global-require */
const embeds = {
  Alert: require('../embeds/AlertEmbed'),
  Arbitration: require('../embeds/ArbitrationEmbed'),
  Acolyte: require('../embeds/AcolyteEmbed'),
  Cambion: require('../embeds/CambionEmbed'),
  Conclave: require('../embeds/ConclaveChallengeEmbed'),
  Darvo: require('../embeds/DarvoEmbed'),
  Enemy: require('../embeds/EnemyEmbed'),
  Event: require('../embeds/EventEmbed'),
  Fissure: require('../embeds/FissureEmbed'),
  Invasion: require('../embeds/InvasionEmbed'),
  News: require('../embeds/NewsEmbed'),
  Sales: require('../embeds/SalesEmbed'),
  Sortie: require('../embeds/SortieEmbed'),
  Tweet: require('../embeds/TweetEmbed'),
  Syndicate: require('../embeds/SyndicateEmbed'),
  VoidTrader: require('../embeds/VoidTraderEmbed'),
  Cycle: require('../embeds/EarthCycleEmbed'),
  Solaris: require('../embeds/SolarisEmbed'),
  Nightwave: require('../embeds/NightwaveEmbed'),
  Outposts: require('../embeds/SentientOutpostEmbed'),
  RSS: require('../embeds/RSSEmbed'),
};

const logger = require('../Logger');

module.exports = {
  embeds,
  logger,
  platforms: process.env.PLATFORMS,
};
