import { createRequire } from 'module';
import fs from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import logger from '#shared/utilities/Logger';

import type { CommandLocaleModule } from './locales/commands/types';

const require = createRequire(import.meta.url);

export const cachedEvents = require('./cachedEvents.json');
export const emoji = require('./emoji.json');
export const factions = require('./factions.json');
export const localeMap = require('./localeMap.json');

const availableLocales = require('./locales.json') as string[];

const activeLocales = (process.env.LOCALES || availableLocales.join(',')).split(',').filter((l) => l?.trim());

export const locales = activeLocales.filter((a) => availableLocales.includes(a));

export type Locale = 'cs' | 'de' | 'en' | 'es' | 'fr' | 'it' | 'ko' | 'pl' | 'pt' | 'ru' | 'sr' | 'tr' | 'zh';

export type CommandLocaleEntry = {
  name: string;
  description: string;
};

export type CommandManifestEntry = {
  name: string;
  description: string;
  name_localizations: Record<string, string>;
  description_localizations: Record<string, string>;
};

/** @deprecated use i18n bundle from utilities; kept for legacy resource loading */
export const i18n: Record<string, Record<string, string>> = {};
locales.forEach((locale) => {
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

export const LocalDiscordLocaleMappings: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-BR',
  zh: 'zh-CN',
};

export const cmds: Record<string, CommandManifestEntry> = {};
const allCommands: Record<string, CommandLocaleModule> = {};
const ldirname = dirname(fileURLToPath(import.meta.url));
const nameRegex = /^[-_\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;

const resolveCommandLocaleFile = (locale: string): string | undefined => {
  for (const ext of ['.ts', '.js']) {
    const candidate = path.resolve(ldirname, './locales/commands', `${locale}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
};

const resolveDiscordLocaleKey = (locale: string): string | undefined => {
  if (DiscordLocales.includes(locale)) return locale;
  const mapped = LocalDiscordLocaleMappings[locale];
  if (mapped && DiscordLocales.includes(mapped)) return mapped;
  return undefined;
};

await Promise.all(
  locales.map(async (locale) => {
    const localeKey = resolveDiscordLocaleKey(locale);
    const filePath = resolveCommandLocaleFile(locale);
    if (!localeKey || !filePath) return;

    allCommands[localeKey] = (await import(pathToFileURL(filePath).href)).default as CommandLocaleModule;
  })
);

const englishCommands = allCommands['en-US'];
if (locales.includes('en') && englishCommands) {
  Object.entries(englishCommands).forEach(([key, { name, description }]) => {
    cmds[key] = {
      name,
      description,
      name_localizations: {},
      description_localizations: {},
    };

    locales.forEach((locale) => {
      if (locale === 'en') return;
      const localeKey = resolveDiscordLocaleKey(locale);
      if (!localeKey) return;
      const l7d = allCommands[localeKey]?.[key];
      if (!l7d) return;
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
      if (nameRegex.test(l7d.name) || process.env.SKIP_INVALID_CMDS === 'false') {
        if (l7d.name !== cmds[key].name) {
          cmds[key].name_localizations[localeKey] = l7d.name;
        }
        if (l7d.description !== cmds[key].description) {
          cmds[key].description_localizations[localeKey] = l7d.description;
        }
      }
    });
  });
} else if (locales.includes('en')) {
  logger.error('English command locale bundle missing; slash-command localizations will be incomplete.');
}
