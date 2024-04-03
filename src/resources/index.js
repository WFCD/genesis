import { createRequire } from 'module';
import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'url';

import logger from '../utilities/Logger.js';

const require = createRequire(import.meta.url);

export const cachedEvents = require('./cachedEvents.json');
export const emoji = require('./emoji.json');
export const factions = require('./factions.json');
export const localeMap = require('./localeMap.json');

const availableLocales = require('./locales.json');

const activeLocales = (process.env.LOCALES || availableLocales.join(',')).split(',').filter((l) => l?.trim());

export const locales = activeLocales.filter((a) => availableLocales.includes(a));

/** @typedef {'cs'|'de'|'en'|'es'|'fr'|'it'|'ko'|'pl'|'pt'|'ru'|'sr'|'tr'|'zh'} Locale */

/**
 * I18n map
 * @type {Record<Locale, I18n>}
 */
export const i18n = {};
locales.forEach((locale) => {
  // eslint-disable-next-line import/no-dynamic-require
  i18n[locale] = require(`./locales/${locale}.json`);
});

export const missionTypes = require('./missionTypes.json');
export const pingables = require('./pingables.json');
export const platformMap = require('./platformMap.json');
export const rssFeeds = require('./rssFeeds.json');
export const syndicates = require('./syndicates.json');
export const trackables = require('./trackables.json');
export const twitch = require('./twitch.json');
export const welcomes = require('./welcomes.json');

export const DiscordLocales = [
  'vi',
  'da',
  'he',
  'zh-TW',
  'ja',
  'th',
  'hi',
  'ru',
  'pl',
  'fr',
  'lt',
  'en-GB',
  'pt-BR',
  'it',
  'cs',
  'bg',
  'hr',
  'tr',
  'hu',
  'ro',
  'ar',
  'de',
  'ko',
  'el',
  'en-US',
  'no',
  'sv-SE',
  'uk',
  'zh-CN',
  'nl',
  'es-ES',
  'fi',
];

export const LocalDiscordLocaleMappings = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
  zh: 'zh-CN',
};

export const cmds = {};
const allCommands = {};
const ldirname = dirname(fileURLToPath(import.meta.url));
const nameRegex = /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;
await Promise.all(
  locales.map(async (locale) => {
    const p = path.resolve(ldirname, './locales/commands', `${locale}.js`);
    if (
      (fs.existsSync(p) && DiscordLocales.includes(locale)) ||
      DiscordLocales.includes(LocalDiscordLocaleMappings[locale])
    ) {
      let localeKey;
      if (DiscordLocales.includes(locale)) localeKey = locale;
      if (DiscordLocales.includes(LocalDiscordLocaleMappings[locale])) localeKey = LocalDiscordLocaleMappings[locale];
      allCommands[localeKey] = (await import(p)).default;
    }
  })
);

if (locales.includes('en')) {
  Object.entries(allCommands['en-US']).forEach(([key, { name, description }]) => {
    cmds[key] = {
      name,
      description,
      name_localizations: {},
      description_localizations: {},
    };

    locales.forEach((locale) => {
      if (locale === 'en') return;
      let localeKey;
      if (DiscordLocales.includes(locale)) localeKey = locale;
      if (DiscordLocales.includes(LocalDiscordLocaleMappings[locale])) localeKey = LocalDiscordLocaleMappings[locale];
      if (!localeKey) return;
      const l7d = allCommands?.[localeKey]?.[key];
      if (process.env.SKIP_INVALID_CMDS !== 'false') {
        if (!nameRegex.test(l7d.name)) {
          logger.error(`Invalid name for ${key} in ${localeKey}`);
          return;
        }
        if (l7d.description?.length > 100) {
          logger.error(`Description too long for ${key} in ${localeKey}`);
          return;
        }
      }
      if (l7d && (nameRegex.test(l7d.name) || process.env.SKIP_INVALID_CMDS === 'false')) {
        if (l7d.name !== cmds[key].name) {
          cmds[key].name_localizations[localeKey] = l7d.name;
        } else {
          logger.debug(`No name change for ${key} in ${localeKey}`);
        }
        if (l7d.description !== cmds[key].description) {
          cmds[key].description_localizations[localeKey] = l7d.description;
        } else {
          logger.debug(`No description change for ${key} in ${localeKey}`);
        }
      }
    });
  });
}
