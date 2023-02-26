import util from 'node:util';
import urlExists from 'url-exists';
import I18n from 'i18n-string-templates';
import fetch from 'node-fetch';
import { apiBase, apiCdnBase } from '../utilities/CommonFunctions.js';
import { i18n as i18nBundle, locales } from '../resources/index.js';

import Alert from '../embeds/AlertEmbed.js';
import Arbitration from '../embeds/ArbitrationEmbed.js';
import Acolyte from '../embeds/AcolyteEmbed.js';
import Cambion from '../embeds/CambionEmbed.js';
import Conclave from '../embeds/ConclaveChallengeEmbed.js';
import Darvo from '../embeds/DarvoEmbed.js';
import Enemy from '../embeds/EnemyEmbed.js';
import Event from '../embeds/EventEmbed.js';
import Fissure from '../embeds/FissureEmbed.js';
import Invasion from '../embeds/InvasionEmbed.js';
import News from '../embeds/NewsEmbed.js';
import Sales from '../embeds/SalesEmbed.js';
import Sortie from '../embeds/SortieEmbed.js';
import Tweet from '../embeds/TweetEmbed.js';
import Syndicate from '../embeds/SyndicateEmbed.js';
import VoidTrader from '../embeds/VoidTraderEmbed.js';
import Cycle from '../embeds/EarthCycleEmbed.js';
import Solaris from '../embeds/SolarisEmbed.js';
import Nightwave from '../embeds/NightwaveEmbed.js';
import Outposts from '../embeds/SentientOutpostEmbed.js';
import SteelPath from '../embeds/SteelPathEmbed.js';
import RSS from '../embeds/RSSEmbed.js';

export const i18ns = {};
locales.forEach((locale) => {
  i18ns[locale] = I18n(i18nBundle, locale);
});

export const exists = util.promisify(urlExists);

export const embeds = {
  Alert,
  Arbitration,
  Acolyte,
  Cambion,
  Conclave,
  Darvo,
  Enemy,
  Event,
  Fissure,
  Invasion,
  News,
  Sales,
  Sortie,
  Tweet,
  Syndicate,
  VoidTrader,
  Cycle,
  Solaris,
  Nightwave,
  Outposts,
  SteelPath,
  RSS,
};

export const between = (activation, key, refreshRate, beats) => {
  const activationTs = new Date(activation).getTime();
  const leeway = 9 * (refreshRate / 10);
  const isBeforeCurr = activationTs < beats[key].currCycleStart + leeway;
  const isAfterLast = activationTs > beats[key].lastUpdate - leeway;
  return isBeforeCurr && isAfterLast;
};

export const getThumbnailForItem = async (query, fWiki) => {
  if (query && !fWiki) {
    const fq = query
      .replace(
        /\d*\s*((?:\w|\s)*)\s*(?:blueprint|receiver|stock|barrel|blade|gauntlet|upper limb|lower limb|string|guard|neuroptics|systems|chassis|link)?/gi,
        '$1'
      )
      .trim()
      .toLowerCase();
    const results = await fetch(`${apiBase}/items/search/${encodeURIComponent(fq)}/?language=en`).then((d) => d.json());
    if (results.length) {
      const url = `${apiCdnBase}img/${results[0].imageName}`;
      if (await exists(url)) {
        return url;
      }
    }
  }
  return '';
};

export const asId = (event, label) => {
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
export function fromNow(d, now = Date.now) {
  return new Date(d).getTime() - now();
}

export const perLanguage = async (fn) =>
  Promise.all(Object.entries(i18ns)?.map(async ([locale, i18n]) => fn({ locale, i18n })));

let currentUpdating = [];
export const updating = {
  reset: () => {
    currentUpdating = [];
  },
  add: (add) => {
    if (currentUpdating.includes(add)) throw new Error('already updating');
    else currentUpdating.push(add);
  },
  remove: (remove) => {
    currentUpdating.splice(currentUpdating.indexOf(remove));
  },
  has: (current) => currentUpdating.includes(current),
};
