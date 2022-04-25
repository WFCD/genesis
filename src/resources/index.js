import { createRequire } from 'module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);

export const cachedEvents = require('./cachedEvents.json');
export const emoji = require('./emoji.json');
export const factions = require('./factions.json');
export const localeMap = require('./localeMap.json');
export const locales = require('./locales.json');

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

export const cmds = {};
const allCommands = {};
await Promise.all(
  locales.map(async (locale) => {
    const p = path.resolve('./src/resources/locales/commands', `${locale}.js`);
    if (fs.existsSync(p)) {
      allCommands[locale] = (await import(p)).default;
    }
  })
);

Object.entries(allCommands.en).forEach(([key, { name, description }]) => {
  cmds[key] = {
    name,
    description,
    name_localizations: {
      en: name,
    },
    description_localizations: {
      en: description,
    },
  };

  locales.forEach((locale) => {
    if (locale === 'en') return;
    const l7d = allCommands?.[locale]?.[key];
    if (l7d) {
      cmds[key].name_localizations[locale] = l7d.name;
      cmds[key].description_localizations[locale] = l7d.description;
    }
  });
});
