// @ts-nocheck -- incremental TS migration; worker notification runtime
import util from 'node:util';

import urlExists from 'url-exists';
import fetch from 'node-fetch';

import createI18n from '#shared/utilities/i18n';
import { apiBase, apiCdnBase } from '#shared/utilities/CommonFunctions';
import { i18n as i18nBundle, locales } from '#shared/resources/index';
import Alert from '#shared/embeds/AlertEmbed';
import Arbitration from '#shared/embeds/ArbitrationEmbed';
import Acolyte from '#shared/embeds/AcolyteEmbed';
import Cambion from '#shared/embeds/CambionEmbed';
import Conclave from '#shared/embeds/ConclaveChallengeEmbed';
import Darvo from '#shared/embeds/DarvoEmbed';
import Enemy from '#shared/embeds/EnemyEmbed';
import Event from '#shared/embeds/EventEmbed';
import Fissure from '#shared/embeds/FissureEmbed';
import Invasion from '#shared/embeds/InvasionEmbed';
import News from '#shared/embeds/NewsEmbed';
import Sales from '#shared/embeds/SalesEmbed';
import Sortie from '#shared/embeds/SortieEmbed';
import Tweet from '#shared/embeds/TweetEmbed';
import Syndicate from '#shared/embeds/SyndicateEmbed';
import VoidTrader from '#shared/embeds/VoidTraderEmbed';
import Cycle from '#shared/embeds/EarthCycleEmbed';
import Solaris from '#shared/embeds/SolarisEmbed';
import Nightwave from '#shared/embeds/NightwaveEmbed';
import Outposts from '#shared/embeds/SentientOutpostEmbed';
import SteelPath from '#shared/embeds/SteelPathEmbed';
import RSS from '#shared/embeds/RSSEmbed';

export const i18ns = {};
locales.forEach((locale) => {
  i18ns[locale] = createI18n(i18nBundle, locale);
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
