'use strict';

const util = require('util');
const exists = util.promisify(require('url-exists'));

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
  SteelPath: require('../embeds/SteelPathEmbed'),
  RSS: require('../embeds/RSSEmbed'),
};

const logger = require('../Logger');
const fetch = require('../resources/Fetcher');
const { apiBase, apiCdnBase } = require('../CommonFunctions');

const syndicates = require('../resources/syndicates.json');
const I18n = require('../settings/I18n');

const i18ns = {};
require('../resources/locales.json').forEach((locale) => {
  i18ns[locale] = I18n.use(locale);
});

const between = (activation, platform, refreshRate, beats) => {
  const activationTs = new Date(activation).getTime();
  const leeway = 9 * (refreshRate / 10);
  const isBeforeCurr = activationTs < (beats[platform].currCycleStart);
  const isAfterLast = activationTs > (beats[platform].lastUpdate - (leeway));
  return isBeforeCurr && isAfterLast;
};

const getThumbnailForItem = async (query, fWiki) => {
  if (query && !fWiki) {
    const fq = query
      .replace(/\d*\s*((?:\w|\s)*)\s*(?:blueprint|receiver|stock|barrel|blade|gauntlet|upper limb|lower limb|string|guard|neuroptics|systems|chassis|link)?/ig, '$1')
      .trim().toLowerCase();
    const results = await fetch(`${apiBase}/items/search/${encodeURIComponent(fq)}`);
    if (results.length) {
      const url = `${apiCdnBase}img/${results[0].imageName}`;
      if (await exists(url)) {
        return url;
      }
    }
  }
  return '';
};

const asId = (event, label) => {
  const uppedTime = new Date(event.expiry);
  uppedTime.setMilliseconds(0);
  uppedTime.setSeconds(0);

  return `${label}:${uppedTime.getTime()}`;
};

/**
 * Returns the number of milliseconds between now and a given date
 * @param   {string} d         The date from which the current time will be subtracted
 * @param   {function} [now] A function that returns the current UNIX time in milliseconds
 * @returns {number}
 */
function fromNow(d, now = Date.now) {
  return new Date(d).getTime() - now();
}

module.exports = {
  embeds,
  logger,
  platforms: process.env.PLATFORMS,
  between,
  getThumbnailForItem,
  syndicates,
  I18n,
  i18ns,
  asId,
  fromNow,
};
