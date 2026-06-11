import { ChannelType, Collection, EmbedBuilder, MessageFlags } from 'discord.js';
import fetch from 'node-fetch';

import { emoji, factions, missionTypes, rssFeeds, trackables as all, welcomes } from '#shared/resources/index';

import logger from './Logger';
import { FISSURE_NODE_TRACKABLE_PATTERN } from './FissureTracking';
import { arbitrationWorldstateAvailable } from './WorldState';

const {
  clantech,
  conclave,
  deals,
  duviri,
  eventTypes,
  fissures,
  nightwave,
  opts,
  resources,
  rewardTypes,
  syndicates,
  twitch,
  twitter,
} = all;

/**
 * Build interaction reply/update options with ephemeral via MessageFlags.
 * @param {boolean|undefined} ephemeral whether the response is ephemeral
 * @param {Record<string, unknown>} [options] other reply options
 * @returns {Record<string, unknown>}
 */
export function withEphemeral(ephemeral: boolean | undefined, options: Record<string, unknown> = {}) {
  const { ephemeral: _ignored, flags, ...rest } = options;
  if (!ephemeral) return rest;

  return { ...rest, flags: ((flags as number | undefined) ?? 0) | MessageFlags.Ephemeral };
}

/**
 * API base path
 * @type {string}
 */
export const apiBase = process.env.API_BASE_PATH || 'https://api.warframestat.us';
/**
 * Genesis asset base URL
 * @type {string}
 */
export const assetBase = process.env.ASSET_BASE_PATH || 'https://cdn.warframestat.us/genesis';
/**
 * Warframe Wiki base url
 * @type {string}
 */
export const wikiBase = process.env.WIKIA_BASE_PATH || 'https://wiki.warframe.com/w/';
/**
 * API base url for the warframe-items cdn
 * @type {string}
 */
export const apiCdnBase = process.env.CDN_BASE_PATH || 'https://cdn.warframestat.us/';

/**
 * Regex to check for vulgarity
 * @type {RegExp}
 */
export const isVulgarCheck =
  /(n[i!1]gg[e3]r|n[i!1]gg[ua]|h[i!1]tl[e3]r|n[a@]z[i!1]|[©ck]un[t7]|fu[©c]k|[©ck]umm?|f[a@4]g|d[i!1]ck|c[o0]ck|boner|sperm|gay|gooch|jizz|pussy|penis|r[i!1]mjob|schlong|slut|wank|whore|sh[i!1]t|sex|fuk|heil|p[o0]rn|pronz|suck|rape|scrotum)/gi;

/**
 * Allowed platforms
 * @type {Array.<string>}
 */
export const platforms = Array.from(
  new Set(['pc', 'ps4', 'xb1', 'swi'].concat((process.env.PLATFORMS || '').split(',').filter((p) => p)))
);

/**
 * Games to enable.
 * Allowed values:
 *  * CORE
 *  * UTIL
 *  * LOGGING
 *  * DESTINY2
 *  * WARFRAME
 *  * CODES
 *  * FUN
 *  * GIVEAWAYS
 * Default Values:
 *  * CORE
 *  * UTIL
 * @type {Array<string>}
 */
export const games = ['CORE'].concat((process.env.GAMES || '').split(',').filter((p) => p));

/**
 * Duration mapping
 * @type {Object}
 */
export const duration = {
  minute: 60,
  hour: 60 * 60,
  day: 60 * 60 * 24,
};

/**
 * Object describing all trackable events
 * @type {Object}
 */
export const trackableEvents: Record<string, any> = {
  events: eventTypes,
  syndicates,
  conclave,
  deals,
  cambion: ['cambion.fass', 'cambion.vome', 'necralisk'],
  cetus: ['cetus.day', 'cetus.night'],
  duviri,
  ostrons: ['cetus.day', 'cetus.night', 'syndicate.ostrons'],
  earth: ['earth.day', 'earth.night'],
  vallis: ['solaris.warm', 'solaris.cold', 'solaris'],
  nightwave,
  rss: rssFeeds.map((feed) => feed.key),
  arbitration: [],
  kuva: [],
  twitch,
  opts,
  baseEvents: [],
};

trackableEvents.baseEvents = eventTypes.filter(
  (e) =>
    !(
      trackableEvents.cambion.includes(e) ||
      trackableEvents.cetus.includes(e) ||
      trackableEvents.duviri.includes(e) ||
      trackableEvents.ostrons.includes(e) ||
      trackableEvents.earth.includes(e) ||
      trackableEvents.vallis.includes(e) ||
      trackableEvents.nightwave.includes(e) ||
      trackableEvents.rss.includes(e) ||
      trackableEvents.twitch.includes(e) ||
      trackableEvents.syndicates.includes(e)
    )
);

trackableEvents['forum.staff'] = trackableEvents.rss.filter((feed) => feed.startsWith('forum.staff'));
trackableEvents.events.push(...trackableEvents.rss);
const tTemp = [];
twitter.types.forEach((type) => {
  twitter.accounts.forEach((account) => {
    const id = `twitter.${account}.${type}`;
    if (!trackableEvents[`twitter.${type}`]) {
      trackableEvents[`twitter.${type}`] = [];
    }
    trackableEvents[`twitter.${type}`].push(id);
    tTemp.push(id);
  });
});
trackableEvents.twitter = tTemp;

const fTemp = [];
const fSpTemp = [];
const arbiTemp = [];
const kuvaTemp = [];
Object.keys(missionTypes).forEach((type) => {
  if (arbitrationWorldstateAvailable && missionTypes[type].arbi) {
    factions.forEach((faction) => {
      if (!trackableEvents[`arbitration.${faction}`]) trackableEvents[`arbitration.${faction}`] = [];
      trackableEvents[`arbitration.${faction}`].push(`arbitration.${faction}.${type}`);
      if (!trackableEvents[`arbitration.${type}`]) trackableEvents[`arbitration.${type}`] = [];
      trackableEvents[`arbitration.${type}`].push(`arbitration.${faction}.${type}`);

      arbiTemp.push(`arbitration.${faction}.${type}`);
    });
  }
  kuvaTemp.push(`kuva.${type}`);

  if (missionTypes[type].fissure) {
    // Construct Fissure types
    fissures.tiers.forEach((tier) => {
      const id = `fissures.${tier}.${type}`;

      if (!trackableEvents[`fissures.${tier}`]) {
        trackableEvents[`fissures.${tier}`] = [];
      }
      trackableEvents[`fissures.${tier}`].push(id);
      if (!trackableEvents[`fissures.${type}`]) {
        trackableEvents[`fissures.${type}`] = [];
      }
      trackableEvents[`fissures.${type}`].push(id);
      fTemp.push(id);

      // steel path
      const spId = `fissures.sp.${tier}.${type}`;
      if (!trackableEvents[`fissures.sp.${tier}`]) {
        trackableEvents[`fissures.sp.${tier}`] = [];
      }
      trackableEvents[`fissures.sp.${tier}`].push(spId);
      if (!trackableEvents[`fissures.sp.${type}`]) {
        trackableEvents[`fissures.sp.${type}`] = [];
      }
      trackableEvents[`fissures.sp.${type}`].push(spId);
      fSpTemp.push(spId);
    });
  }
});
// gotta make sure this is outside the loop
// and after it completes so all the generated ones are first
trackableEvents.fissures = fTemp;
trackableEvents.kuva = kuvaTemp;
trackableEvents.arbitration = arbiTemp;
trackableEvents['fissures.sp'] = fSpTemp;

trackableEvents.events.push(
  ...trackableEvents.twitter,
  ...trackableEvents.fissures,
  ...trackableEvents.arbitration,
  ...trackableEvents.kuva,
  ...trackableEvents.twitch,
  ...trackableEvents['fissures.sp']
);

export const dyn = [
  'solaris\\.warm\\.[0-9]?[0-9]',
  'solaris\\.cold\\.[0-9]?[0-9]',
  'cetus\\.day\\.[0-1]?[0-9]?[0-9]?',
  'cetus\\.night\\.[0-1]?[0-9]?[0-9]?',
  'cambion\\.fass\\.[0-1]?[0-9]?[0-9]?',
  'cambion\\.vome\\.[0-1]?[0-9]?[0-9]?',
  'duviri\\.(joy|anger|envy|sorrow|fear)(\\.[0-1]?[0-9]?[0-9]?)?',
  'fissures\\.node\\.[a-z0-9_]+',
  'fissures\\.sp\\.node\\.[a-z0-9_]+',
  ...trackableEvents.rss,
  ...trackableEvents.events,
  ...rewardTypes,
  ...Object.keys(trackableEvents),
  ...opts,
];

/**
 * Captures for commonly needed parameters
 * @type {Object}
 * @property {string} channel     channel capture body
 * @property {string} role        role capture body
 * @property {string} user        user capture body
 * @property {string} trackables  possible trackables capture body
 * @property {string} platforms   platforms capture body
 */
export const captures = {
  channel: '(?:(?:<#)?(\\d{15,20})(?:>)?)',
  role: '(?:(?:<@&)?(\\d{15,20})(?:>)?)',
  user: '(?:(?:<@!?)?(\\d{15,20})(?:>)?)',
  trackables: `(${dyn.join('|')})`,
  platforms: `(${platforms.join('|')})`,
  updates: '[\\d]{1,3}\\.[\\d]{1,3}\\.?[\\d]{0,3}',
};

/**
 * Object of all trackable items
 * @type {Object}
 */
export const trackableItems = {
  items: rewardTypes,
  clantech,
  resources,
};

/**
 * Get the trackable events and items based on the parameter
 * @param {string} term Term to convert to trackable
 * @returns {Object}
 */
export const termToTrackable = (term) => {
  // const cetusCustomTimeRegex = /cetus\.(day|night)\.[0-1]?[0-9]?[0-9]?/gi;
  // const earthCustomTimeRegex = /earth\.(day|night)\.[0-1]?[0-9]?[0-9]?/gi;
  // const solarisCustomTimeRegex = /solaris\.(warm|cold)\.[0-9]?[0-9]?/gi;
  // const cambionCustomTimeRegex = /cambion\.(fass|vome)\.[0-1]?[0-9]?[0-9]?/gi;

  const trackable = {
    events: [],
    items: [],
  };

  // TODO: Eventually reenable when more stable
  // if (
  //   cetusCustomTimeRegex.test(term) ||
  //   earthCustomTimeRegex.test(term) ||
  //   solarisCustomTimeRegex.test(term) ||
  //   cambionCustomTimeRegex.test(term)
  // ) {
  //   trackable.events = term;
  //   return trackable;
  // }

  if (term === 'events') {
    trackable.events = eventTypes;
    return trackable;
  }

  if (term === 'items') {
    trackable.items = rewardTypes;
    return trackable;
  }

  if (!arbitrationWorldstateAvailable && (term === 'arbitration' || term.startsWith('arbitration.'))) {
    return trackable;
  }

  if (FISSURE_NODE_TRACKABLE_PATTERN.test(term)) {
    trackable.events = [term];
    return trackable;
  }

  if (trackableEvents[term]) {
    trackable.events = trackableEvents[term];
    return trackable;
  }

  if (trackableItems[term]) {
    trackable.items = trackableItems[term];
    return trackable;
  }

  if (eventTypes.includes(term)) {
    trackable.events = term;
    return trackable;
  }

  if (rewardTypes.includes(term)) {
    trackable.items = term;
    return trackable;
  }
  return trackable;
};

/**
 * Find trackables based on the parameters
 * @param {Array<string>} params List of terms to find trackables for
 * @returns {TrackingOptions}
 */
export const trackablesFromParameters = (params) => {
  const trackables = {
    events: [],
    items: [],
  };
  let terms;
  if (params.length) {
    terms = params.map((term) => term.trim()).filter(Boolean);
  } else {
    return trackables;
  }

  if (terms[0] === 'all') {
    trackables.events = trackables.events.concat(eventTypes);
    trackables.items = trackables.items.concat(rewardTypes);
  } else {
    terms.forEach((term) => {
      const { events, items } = termToTrackable(term);

      trackables.events = trackables.events.concat(events);
      trackables.items = trackables.items.concat(items);
    });
  }
  return trackables;
};

/**
 * RegExp to determine a trackable
 * @type {RegExp}
 */
export const eventsOrItems = new RegExp(captures.trackables, 'ig');

/**
 * Get a randome welcome message
 * @returns {string} welcome string
 */
export const getRandomWelcome = () => welcomes[Math.floor(Math.random() * welcomes.length)];

/**
 * Create array of arrays from
 * @param  {any[]} arr        array of things
 * @param  {number} chunkSize size of chunk
 * @returns {Array.<any[]>}   Array of arrays of items
 */
export const createGroupedArray = (arr, chunkSize = 10) => {
  const groups = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    groups.push(arr.slice(i, i + chunkSize));
  }
  return groups;
};

/**
 * Get event and item matches from message
 * @param  {Discord.Message} message message to fetch data from
 * @returns {string[]}         Array of matches
 */
export function getEventsOrItems(message) {
  const matches = message.strippedContent.match(eventsOrItems);
  return matches || [];
}

/**
 * Simple string filter for filtering empty or undefined strings from an array
 * @param  {string} chunk String chunk to check
 * @returns {boolean}       Whether or not the string is allowed
 */
export const stringFilter = (chunk) => chunk && chunk.length;

/**
 * Field limit for chunked embeds
 * @type {Number}
 */
export const fieldLimit = 5;

/**
 * Default values for embeds
 * @type {Object}
 */
export const embedDefaults = {
  color: 0x77dd77,
  footer: {
    text: 'Sent',
    iconURL: 'https://warframestat.us/wfcd_logo_color.png',
  },
  timestamp: new Date(),
};

/**
 * Chunkify a string
 * @param  {string} string                    String to chunkify
 * @param  {Array.<string>}  [newStrings=[]]  Chunked strings
 * @param  {string} [breakChar='; ']          Break character to check for splits on
 * @param  {number} [maxLength=1000]          Maximum length per string
 * @param {boolean} [checkTitle=false]        Whether or not to check for titles at the end
 * @returns {Array.<string>}                  Array of string chunks
 */
export const chunkify = ({ string, newStrings = [], breakChar = '; ', maxLength = 1000, checkTitle = false }) => {
  let breakIndex;
  let chunk;
  if (!string) return undefined;
  if (string.length > maxLength) {
    while (string.length > 0) {
      // Split message at last break character, if it exists
      chunk = string.substring(0, maxLength);
      breakIndex = chunk.lastIndexOf(breakChar) !== -1 ? chunk.lastIndexOf(breakChar) : maxLength;

      if (checkTitle) {
        // strip the last title if it starts with a title
        if (string.endsWith('**')) {
          const endTitle = string.match(/\*\*(.*)\*\*\s*$/g)[1] || '';
          string = string.replace(/\*\*(.*)\*\*\s*$/g, '');
          breakIndex -= endTitle.length;
        }
      }

      newStrings.push(string.substring(0, breakIndex));
      // Skip char if split on line break
      if (breakIndex !== maxLength) {
        breakIndex += 1;
      }

      string = string.substring(breakIndex, string.length);
    }
  }
  newStrings.push(string);
  return newStrings;
};

export type FixedWidthTableColumn = {
  header: string;
  cells: string[];
  maxWidth?: number;
  minWidth?: number;
  align?: 'left' | 'right';
};

/**
 * Monospace fixed-width table for embed descriptions (Whereis / Whatsin style).
 */
export const formatFixedWidthTable = (columns: FixedWidthTableColumn[]) => {
  if (!columns.length) return '```\n```';

  const rowCount = Math.max(...columns.map((column) => column.cells.length), 0);
  const widths = columns.map((column) => {
    const lengths = [column.header.length, ...column.cells.map((cell) => cell.length)];
    const natural = Math.max(column.minWidth ?? 0, ...lengths);
    return column.maxWidth === undefined ? natural : Math.min(column.maxWidth, natural);
  });

  const formatCell = (text: string, width: number, align: FixedWidthTableColumn['align'] = 'left') => {
    const clipped = text.length <= width ? text : `${text.slice(0, Math.max(width - 1, 1))}…`;
    return align === 'right' ? clipped.padStart(width, ' ') : clipped.padEnd(width, ' ');
  };

  const header = columns.map((column, index) => formatCell(column.header, widths[index], column.align)).join('  ');
  const divider = widths.map((width) => '-'.repeat(width)).join('  ');
  const body = Array.from({ length: rowCount }, (_, rowIndex) =>
    columns.map((column, index) => formatCell(column.cells[rowIndex] ?? '', widths[index], column.align)).join('  ')
  );

  return `\`\`\`\n${[header, divider, ...body].join('\n')}\n\`\`\``;
};

/**
 * Convert html string content into semi-similar discord-flavored markdown
 * @param  {string} htmlString html string to convert
 * @returns {string}            markdinated string
 */
export const markdinate = (htmlString) =>
  htmlString
    .split('\n')
    .map((l) => l.trim())
    .join('\n') // trim lines
    .replace(/\r\n/gm, '\n') // replace CRLF with LF
    .replace(/<\/?strong>/gm, '**') // swap <strong> tags for their md equivalent
    .replace(/<br\s*\/?>/g, '\n') // replace manual breaks with break character
    .replace(/<\/li>\s*<li>/gm, '</li>\n<li>') // clean up breaks between list items
    .replace(/<li\s?(?:class=".*")?\s?(?:dir=".*")?>\n/gm, '- ') // strip list items to bullets, replace later with emoji
    .replace(/ipsnoembed="false" /gm, '') // manually replace ipsnoembed, it causes issues given location
    .replace(/ipsnoembed="true" /gm, '') // manually replace ipsnoembed, it causes issues given location
    .replace(/<a href="(.*)" rel="external nofollow(?: noopener)?"\s?(?:target="_blank")?>(.*)<\/a>/gm, '[$2]($1)')
    .replace(/&amp;/gm, '&') // replace ampersand entity... it looks weird with some titles
    .replace(/<\/li>/gm, '') // strip li end tags
    .replace(/<(?:.|\n)*?>/gm, '') // replace all other tags, like images and paragraphs... cause they uuugly
    .replace(/-\s+\n/g, '- ')
    .replace(/\n\s*\n+\s*/gm, '\n\n') // strip 2+ line endings to max 2
    .replace(/\*\*\n\n/gm, '**\n') // strip any newlines between headers and content to collapse content
    .replace(/^\s*-\s*\n\s*\[/g, '- [')
    .replace(/^- /gm, ':white_small_square:') // swap bullets for emoji
    .trim();

/**
 * Check that embeds are valid, and merge values into array
 * @param  {Array.<any>} original  Original array
 * @param  {Array.<any>|any} value Value to merge into array
 */
export const checkAndMergeEmbeds = (original, value) => {
  if (value instanceof Array) {
    original.push(...value);
  } else {
    original.push(value);
  }
};

export const EMBED_CHAR_LIMIT = 6000;
export const EMBED_CHAR_SAFE = 5500;
export const EMBED_FIELD_NAME_LIMIT = 256;
export const EMBED_FIELD_VALUE_LIMIT = 1024;
export const EMBED_FIELD_COUNT_MAX = 25;

export const sanitizeEmbedField = (field: { name: string; value: string; inline?: boolean }) => {
  const name = String(field.name ?? '')
    .trim()
    .slice(0, EMBED_FIELD_NAME_LIMIT);
  let value = String(field.value ?? '').trim();
  if (value.length > EMBED_FIELD_VALUE_LIMIT) {
    value = `${value.slice(0, EMBED_FIELD_VALUE_LIMIT - 1)}…`;
  }
  if (!name.length || !value.length) return undefined;
  return { name, value, inline: field.inline ?? true };
};

/** Approximate total embed text length for Discord's 6000-char cap. */
export const estimateEmbedSize = (embed: EmbedBuilder) => {
  const data = embed.data;
  let size = 0;
  const add = (text?: string | null) => {
    if (text) size += text.length;
  };

  add(data.title);
  add(data.description);
  add(data.footer?.text);
  add(data.author?.name);
  for (const field of data.fields ?? []) {
    add(field.name);
    add(field.value);
  }

  return size;
};

/** Split an embed across multiple messages when it exceeds Discord's embed size cap. */
export const splitEmbedByCharLimit = (embed: EmbedBuilder, maxSize = EMBED_CHAR_SAFE) => {
  if (estimateEmbedSize(embed) <= EMBED_CHAR_LIMIT) return [embed];

  const { title, description, footer, author, fields = [] } = embed.data;

  const startEmbed = (part: number) => {
    const next = new EmbedBuilder(embedDefaults);
    const nextTitle = part ? `${title ?? 'Settings'}, ctd.` : title;
    if (nextTitle) next.setTitle(nextTitle);
    if (!part && description) next.setDescription(description);
    if (!part && footer) next.setFooter(footer);
    if (!part && author) next.setAuthor(author);
    return next;
  };

  if (!fields.length) {
    if (description && description.length > EMBED_CHAR_SAFE) {
      const truncated = startEmbed(0);
      truncated.setDescription(`${description.slice(0, EMBED_CHAR_SAFE - 1)}…`);
      return [truncated];
    }
    return [embed];
  }

  const results: EmbedBuilder[] = [];
  let part = 0;
  let current = startEmbed(part);
  let currentSize = estimateEmbedSize(current);
  let fieldCount = 0;

  for (const field of fields) {
    const sanitized = sanitizeEmbedField(field);
    if (!sanitized) continue;

    const fieldSize = sanitized.name.length + sanitized.value.length;
    if (fieldCount > 0 && (currentSize + fieldSize > maxSize || fieldCount >= EMBED_FIELD_COUNT_MAX)) {
      results.push(current);
      part += 1;
      current = startEmbed(part);
      currentSize = estimateEmbedSize(current);
      fieldCount = 0;
    }

    current.addFields(sanitized);
    currentSize += fieldSize;
    fieldCount += 1;
  }

  if ((current.data.fields?.length ?? 0) > 0 || current.data.description) {
    results.push(current);
  }

  return results.length ? results : [embed];
};

export const ensureEmbedsWithinLimit = (embeds: Array<EmbedBuilder | EmbedBuilder['data']>) =>
  embeds.flatMap((embed) => splitEmbedByCharLimit(embed instanceof EmbedBuilder ? embed : EmbedBuilder.from(embed)));

const packFieldsIntoEmbeds = (fields: Array<{ name: string; value: string; inline?: boolean }>, title: string) => {
  const sanitized = fields
    .map((field) => sanitizeEmbedField(field))
    .filter((field): field is NonNullable<ReturnType<typeof sanitizeEmbedField>> => Boolean(field));
  if (!sanitized.length) return [];

  const results: EmbedBuilder[] = [];
  let current = new EmbedBuilder(embedDefaults);
  if (title) current.setTitle(title);
  let currentSize = estimateEmbedSize(current);
  let fieldCount = 0;

  for (const field of sanitized) {
    const fieldSize = field.name.length + field.value.length;
    if (fieldCount > 0 && (currentSize + fieldSize > EMBED_CHAR_SAFE || fieldCount >= EMBED_FIELD_COUNT_MAX)) {
      results.push(current);
      current = new EmbedBuilder(embedDefaults);
      if (title) current.setTitle(`${title}, ctd.`);
      currentSize = estimateEmbedSize(current);
      fieldCount = 0;
    }

    current.addFields(field);
    currentSize += fieldSize;
    fieldCount += 1;
  }

  if (fieldCount > 0) results.push(current);
  return results;
};

const nav = ['◀', '▶', '⏮', '⏭', '🛑'];

/**
 * Create a page collector for the given message and pages
 * @param   {Discord.Message}                 msg     Message to start the page collector from
 * @param   {(Object|EmbedBuilder)}   pages   Array of possible pages
 * @param   {Discord.User}                    author  Calling author
 */
export const createPageCollector = async (msg, pages, author) => {
  if (pages.length <= 1 || !msg) return;

  let page = 1;
  // await msg.react('⏮');
  await msg.react('◀');
  // await msg.react('🛑');
  await msg.react('▶');
  // await msg.react('⏭');

  const rColl = (reaction, user) => nav.includes(reaction.emoji.name) && user.id === author.id;
  const collector = msg.createReactionCollector(rColl, { time: 600000 });
  const timeout = setTimeout(() => {
    msg.reactions.removeAll();
  }, 601000);

  collector.on('collect', async (reaction) => {
    switch (reaction.emoji.name) {
      case '◀':
        if (page > 1) page -= 1;
        break;
      case '▶':
        if (page <= pages.length) page += 1;
        break;
      case '⏮':
        page = 1;
        break;
      case '⏭':
        page = pages.length;
        break;
      case '🛑':
        msg.reactions.removeAll();
        clearTimeout(timeout);
        return;
      default:
        break;
    }
    try {
      await reaction.users.remove(author.id);
    } catch (e) {
      // can't remove
    }

    if (page <= pages.length && page > 0) {
      const newPage = pages[page - 1];
      const pageInd = `Page ${page}/${pages.length}`;
      if (newPage.footer) {
        if (newPage instanceof EmbedBuilder) {
          const footer = newPage.data.footer;
          if (footer?.text.indexOf('Page') === -1) {
            newPage.setFooter({ text: `${pageInd} • ${footer.text}`, iconURL: footer.icon_url });
          }
        } else if (newPage.footer.text) {
          if (newPage.footer.text.indexOf('Page') === -1) {
            newPage.footer.text = `${pageInd} • ${newPage.footer.text}`;
          }
        } else {
          newPage.footer.text = pageInd;
        }
      } else {
        newPage.footer = { text: pageInd };
      }
      try {
        msg.edit({ embeds: [newPage] });
      } catch (err) {
        logger.error(`${err.message} while editing to ${newPage.title}`);
      }
    } else if (page < 1) {
      page = 1;
    } else if (page > pages.length) {
      page = pages.length;
    }
  });
};

/**
 * Set up pages from an array of embeds
 * @param  {Array.<Object|EmbedBuilder>}  pages    Array of embeds to use as pages
 * @param  {Discord.Message}              message  Message for author
 * @param  {Settings}                     settings Settings
 */
export const setupPages = async (pages, { message, settings }) => {
  if (pages.length && !!(await message.fetch({ force: true }))) {
    const msg = await message.reply({ embeds: [pages[0]] });
    await createPageCollector(msg, pages, message.author);
  }
  if (parseInt(await settings.getChannelSetting(message.channel, 'delete_after_respond'), 10) && message.deletable) {
    setTimeout(message.delete, 10000);
  }
};

/**
 * Create an embed with chunked fields
 * @param  {string} stringToChunk string that will be broken up for the fields
 * @param  {string} title         title of the embed
 * @param  {string} breakChar     character to break on
 * @returns {EmbedBuilder}               Embed
 */
export const createChunkedEmbed = (stringToChunk, title, breakChar) => {
  const chunks = (chunkify({ string: stringToChunk, breakChar, maxLength: 900 }) || []).filter(stringFilter);
  if (!chunks.length) {
    const embed = new EmbedBuilder(embedDefaults);
    embed.setTitle(title);
    embed.setDescription(`No ${title}`);
    return embed;
  }

  const continuationFields = chunks
    .slice(1)
    .map((chunk) => sanitizeEmbedField({ name: '\u200B', value: chunk, inline: true }))
    .filter((field): field is NonNullable<ReturnType<typeof sanitizeEmbedField>> => Boolean(field));

  const embeds = packFieldsIntoEmbeds(continuationFields, title);
  const first = embeds[0] ?? new EmbedBuilder(embedDefaults).setTitle(title);
  if (!embeds.length) first.setTitle(title);
  first.setDescription(String(chunks[0]).slice(0, EMBED_FIELD_VALUE_LIMIT));
  if (!embeds.length) return first;
  embeds[0] = first;
  return embeds.length === 1 ? embeds[0] : embeds;
};

/**
 * Chunk fields
 * @param {Array<string>} valArr values to map
 * @param {string} [title] title to use
 * @param {string} [chunkStr] separator
 * @returns {Array.<Discord.EmbedField>}
 */
export const chunkFields = (valArr, title = 'Chunkeroo', chunkStr = '; ') => {
  const fieldTitle = String(title).slice(0, EMBED_FIELD_NAME_LIMIT - ', ctd.'.length);
  const chunkified = chunkify({ string: valArr.join(chunkStr), maxLength: 1000 });
  if (!chunkified) {
    return [];
  }
  return chunkified
    .map((val, ind) => {
      if (val && val.length) {
        return sanitizeEmbedField({
          name: `${fieldTitle}${ind > 0 ? ', ctd.' : ''}`,
          value: val,
          inline: true,
        });
      }
      return undefined;
    })
    .filter((field): field is NonNullable<ReturnType<typeof sanitizeEmbedField>> => Boolean(field));
};

export const constructTypeEmbeds = (types) => {
  const includedTypes = { ...trackableEvents };
  Object.keys(trackableEvents).forEach((eventType) => {
    includedTypes[eventType] = [];
  });

  types.forEach((type) => {
    let found = false;
    Object.keys(trackableEvents).forEach((eventType) => {
      if (trackableEvents[eventType].includes(type)) {
        includedTypes[eventType].push(type);
        found = true;
      }
    });
    if (!found) {
      if (!includedTypes['no type']) {
        includedTypes['no type'] = [];
      }
      includedTypes['no type'].push(type);
    }
  });

  const fields = [];
  Object.keys(includedTypes).forEach((type) => {
    const chunked = chunkFields(includedTypes[type], type);
    if (chunked.length) {
      fields.push(...chunked);
    }
  });
  return packFieldsIntoEmbeds(fields, 'Event Trackables');
};

export const constructItemEmbeds = (types) => {
  const includedItems = { ...trackableItems };
  Object.keys(trackableItems).forEach((itemType) => {
    includedItems[itemType] = [];
    types.forEach((type) => {
      if (trackableItems[itemType].includes(type)) {
        includedItems[itemType].push(type);
      }
    });
  });

  const fields = [];
  Object.keys(includedItems).forEach((item) => {
    const chunked = chunkFields(includedItems[item], item);
    if (chunked.length) {
      fields.push(...chunked);
    }
  });
  return packFieldsIntoEmbeds(fields, 'Item Trackables');
};

export async function sendTrackInstructionEmbeds({ message, prefix, call, settings }) {
  const pages = [];
  pages.push({
    type: 'rich',
    color: 0x0000ff,
    fields: [
      {
        name: `${prefix}${call} <event(s)/item(s) to ${call === 'untrack' ? 'un' : ''}track>`,
        value: 'Track events/items to be alerted in this channel.',
        inline: true,
      },
    ],
  });

  const trackedItems = constructItemEmbeds(rewardTypes);
  const trackedEvents = constructTypeEmbeds(eventTypes);
  checkAndMergeEmbeds(pages, trackedItems);
  checkAndMergeEmbeds(pages, trackedEvents);

  switch (call) {
    case 'track':
      pages[0].fields[0].value = 'Track events/items to be alerted in this channel.';
      break;
    case 'untrack':
      pages[0].fields[0].value = 'Untrack events/items to be alerted in this channel.';
      break;
    case 'set ping':
      pages[0].fields[0].value = 'Set the text added before an event/item notification.';
      pages[0].fields.push({
        name: '**Ping:**',
        value:
          'Whatever string you want to be added before a notification for this item or event. If you leave this blank, the ping for this item/event will be cleared',
        inline: true,
      });
      break;
    default:
      break;
  }

  switch (call) {
    case 'set ping':
      break;
    default:
      break;
  }

  if (pages.length) {
    return setupPages(pages, { message, settings });
  }
  return undefined;
}

const DAMAGE_EMOJI_KEYS = new Set([
  'electricity',
  'cold',
  'heat',
  'toxin',
  'radiation',
  'viral',
  'gas',
  'blast',
  'corrosive',
  'magnetic',
  'impact',
  'puncture',
  'slash',
  'void',
]);

const dtEmojiForTag = (tag: string) => {
  const upper = tag.toUpperCase();
  const aliases: Record<string, string> = {
    IMPACT: 'impact',
    IMPACT_COLOR: 'impact',
    PUNCTURE: 'puncture',
    PUNCTURE_COLOR: 'puncture',
    SLASH: 'slash',
    SLASH_COLOR: 'slash',
    FIRE: 'heat',
    FIRE_COLOR: 'heat',
    FREEZE: 'cold',
    FREEZE_COLOR: 'cold',
    POISON: 'toxin',
    POISON_COLOR: 'toxin',
    ELECTRICITY: 'electricity',
    ELECTRICITY_COLOR: 'electricity',
    MAGNETIC: 'magnetic',
    MAGNETIC_COLOR: 'magnetic',
    RADIATION: 'radiation',
    RADIATION_COLOR: 'radiation',
    RADIANT_COLOR: 'radiation',
    CORROSIVE: 'corrosive',
    CORROSIVE_COLOR: 'corrosive',
    VIRAL: 'viral',
    VIRAL_COLOR: 'viral',
    GAS: 'gas',
    GAS_COLOR: 'gas',
    EXPLOSION: 'blast',
    EXPLOSION_COLOR: 'blast',
    SENTIENT: 'void',
  };
  const key = aliases[upper] ?? upper.replace(/_COLOR$/, '').toLowerCase();
  return emoji[key as keyof typeof emoji] ?? emoji[`<DT_${upper}>` as keyof typeof emoji] ?? null;
};

/** Replace only `<DT_*>` / `<DT_*_COLOR>` tokens with damage/element emojis. */
export const emojifyDtTags = (text: string) => {
  if (typeof text !== 'string') return text;
  return text.replace(/<DT_([A-Z0-9_]+)>/gi, (_, tag) => {
    const glyph = dtEmojiForTag(tag);
    return glyph ? ` ${glyph} ` : `<DT_${tag}>`;
  });
};

const shieldCustomEmojis = (input: string) => {
  const saved: string[] = [];
  const shielded = input.replace(/<a?:\w+:\d+>/g, (match) => {
    saved.push(match);
    return `\x00${saved.length - 1}\x00`;
  });
  return { shielded, saved };
};

const restoreCustomEmojis = (input: string, saved: string[]) =>
  // eslint-disable-next-line no-control-regex
  input.replace(/\x00(\d+)\x00/g, (_, index) => saved[Number(index)] ?? '');

export const emojify = (stringWithoutEmoji) => {
  if (typeof stringWithoutEmoji !== 'string') return stringWithoutEmoji;

  const stringWithEmoji = emojifyDtTags(stringWithoutEmoji);
  const { shielded, saved } = shieldCustomEmojis(stringWithEmoji);

  let processed = shielded;
  Object.keys(emoji).forEach((identifier) => {
    if (identifier.startsWith('<DT_') || identifier.endsWith('_id') || DAMAGE_EMOJI_KEYS.has(identifier)) {
      return;
    }
    const pattern = identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    processed = processed.replace(new RegExp(`\\b${pattern}\\b`, 'ig'), ` ${emoji[identifier as keyof typeof emoji]} `);
  });

  return restoreCustomEmojis(processed, saved);
};

export const getEmoji = (identifier) => emoji[identifier] || '';

/**
 * @param   {number} millis The number of milliseconds in the time delta
 * @returns {string}
 */
export const timeDeltaToString = (millis) => {
  if (typeof millis !== 'number') {
    throw new TypeError('millis should be a number');
  }
  const timePieces = [];
  const prefix = millis < 0 ? '-' : '';
  let seconds = Math.abs(millis / 1000);

  if (seconds >= duration.day) {
    timePieces.push(`${Math.floor(seconds / duration.day)}d`);
    seconds = Math.floor(seconds) % duration.day;
  }

  if (seconds >= duration.hour) {
    timePieces.push(`${Math.floor(seconds / duration.hour)}h`);
    seconds = Math.floor(seconds) % duration.hour;
  }

  if (seconds >= duration.minute) {
    timePieces.push(`${Math.floor(seconds / duration.minute)}m`);
    seconds = Math.floor(seconds) % duration.minute;
  }

  if (seconds >= 0) {
    timePieces.push(`${Math.floor(seconds)}s`);
  }
  return `${prefix}${timePieces.join(' ')}`;
};

export const timeDeltaToMinutesString = (millis) => {
  if (typeof millis !== 'number') {
    throw new TypeError('millis should be a number');
  }
  const timePieces = [];
  const prefix = millis < 0 ? '-' : '';
  const seconds = Math.abs(millis / 1000);

  if (seconds >= duration.minute) {
    timePieces.push(`${Math.floor(seconds / duration.minute)}m`);
  }

  return `${prefix}${timePieces.join(' ')}`;
};

/**
 * Returns the number of milliseconds between now and a given date
 * @param   {Date} d         The date from which the current time will be subtracted
 * @param   {function} [now] A function that returns the current UNIX time in milliseconds
 * @returns {number}
 */
export const fromNow = (d, now = Date.now) => d.getTime() - now();

/**
 * Get the list of channels to enable commands in based on the parameters
 * @param {string|Array<Channel>} channelsParam parameter for determining channels
 * @param {Discord.Message} message Discord message to get information on channels
 * @param {Collection.<Discord.Channel>} channels Channels allowed to be searched through
 * @returns {Array<string>} channel ids to enable commands in
 */
export const getChannel = (channelsParam, message, channels) => {
  let { channel } = message;
  let channelsColl;
  if (message.guild) {
    channelsColl = message.guild.channels.cache;
  } else {
    channelsColl = new Collection();
    channelsColl.set(message.channel.id, message.channel);
  }

  if (typeof channelsParam === 'string') {
    // handle it for strings
    if (channelsParam !== 'here') {
      channel = (channels || channelsColl).get(channelsParam.trim());
    } else if (channelsParam === 'here') {
      channel = message.channel;
    }
  }
  return channel;
};

/**
 * Get the list of channels to enable commands in based on the parameters
 * @param {string|Array<Channel>} channelsParam parameter for determining channels
 * @param {Discord.Message} message Discord message to get information on channels
 * @returns {Array<string>} channel ids to enable commands in
 */
export const getChannels = (channelsParam, message) => {
  let channels = [];
  // handle it for strings
  if (channelsParam !== 'all' && channelsParam !== 'current' && channelsParam !== '*') {
    channels.push(message.guild.channels.cache.get(channelsParam.trim().replace(/([<>#])/gi, '')));
  } else if (channelsParam === 'all' || channelsParam === '*') {
    channels = channels.concat(
      Array.from(message.guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildText))
    );
  } else if (channelsParam === 'current') {
    channels.push(message.channel);
  }
  return channels;
};

/**
 * Get the target role or user from the parameter string
 *    or role mentions or user mentions, preferring the latter 2.
 * @param {string} targetParam string from the command to determine the user or role
 * @param {Collection<Role>} roleMentions role mentions from the command
 * @param {Collection<User>} userMentions user mentions from the command
 * @param {Discord.Message} message message to get information on users and roles
 * @returns {Role|User} target or user to disable commands for
 */
export const getTarget = (targetParam, roleMentions, userMentions, message) => {
  let target;
  const roleMention = roleMentions.first();
  const userMention = userMentions.first();
  if (roleMentions.size > 0) {
    target = roleMention;
    target.type = 'Role';
  } else if (userMentions.size > 0) {
    target = userMention;
    target.type = 'User';
  } else {
    const userTarget = message.guild.members.cache.get(targetParam);
    const roleTarget = message.guild.roles.cache.get(targetParam);
    if (targetParam === '*') {
      target = message.guild.roles.everyone;
      target.type = 'Role';
    } else if (roleTarget) {
      target = roleTarget;
      target.type = 'Role';
    } else if (userTarget) {
      target = userTarget;
      target.type = 'User';
    } else {
      target = '';
    }
  }
  return target;
};

export const resolveRoles = ({ mentions = undefined, content = '', guild = undefined }) => {
  let roles = [];
  if (mentions && mentions.roles) {
    roles = roles.concat(mentions.roles.array());
  }
  const roleRegex = /(\d{16,19})/g;
  let matches: string[] | null = content.match(roleRegex);
  if (matches?.length) {
    matches = matches
      .slice(0, 1)
      .map((match) => {
        if (guild.roles.cache.has(match)) {
          return guild.roles.cache.get(match);
        }
        return undefined;
      })
      .filter((match) => typeof match !== 'undefined');
  }

  if (matches) {
    roles = [...roles, ...matches];
  }
  return roles;
};

/**
 * Get all the users out of a role as users, not members
 * @param  {Discord.Role} role role to convert members from
 * @returns {Discord.User[]}      array of discord users
 */
export const usersInRole = (role) => role.members.map((member) => member.user);

/**
 * Gets the list of users from the mentions in the call
 * @param {Discord.Message} message Channel message
 * @param {boolean} excludeAuthor whether or not to exclude the author in the list
 * @returns {Array.<User>} Array of users to send message
 */
export const getUsersForCall = (message, excludeAuthor) => {
  const users = [];
  if (message.mentions.roles) {
    message.mentions.roles.forEach((role) => users.push(...usersInRole(role)));
  }
  if (message.mentions.users) {
    message.mentions.users.forEach((user) => {
      if (users.indexOf(user) === -1) {
        users.push(user);
      }
    });
  }
  if (!excludeAuthor) {
    let authorIncluded = false;
    users.forEach((user) => {
      if (user.id === message.author.id) {
        authorIncluded = true;
      }
    });
    if (!authorIncluded) {
      users.push(message.author);
    }
  }
  return users;
};

export const resolvePool = async (
  message,
  settings,
  { explicitOnly = false, skipManages = false, pool = undefined, checkRestriction = false, allowMultiple = false } = {
    explicitOnly: false,
    skipManages: false,
  }
) => {
  let poolId = pool;
  if (!skipManages && !(await settings.userManagesPool(message.author, poolId))) {
    poolId = undefined;
  } else {
    return poolId;
  }
  const explicitPoolMatches = message.strippedContent.match(/--pool\s+([a-zA-Z0-9-]*)/i);

  if (explicitPoolMatches && explicitPoolMatches.length > 1) {
    [, poolId] = explicitPoolMatches;
    if (!skipManages && !(await settings.userManagesPool(message.author, poolId))) {
      poolId = undefined;
    }
  } else if (!explicitOnly) {
    let pools = (await settings.getPoolsUserManages(message.author)).map((poolRow) => poolRow.pool_id);
    if (pools.length > 1 && allowMultiple) {
      return pools;
    }
    if (pools.length === 1) {
      [poolId] = pools;
    } else if (pools.length === 0) {
      poolId = undefined;
    } else if (await settings.getGuildsPool(message.guild).length) {
      pools = await settings.getGuildsPool(message.guild);
      if (pools.length === 1 && (skipManages || (await settings.userManagesPool(message.author, pools[0])))) {
        [poolId] = pools;
      }
    } else {
      poolId = undefined;
    }
  }

  if (poolId && checkRestriction && (await settings.isPoolRestricted(poolId))) {
    poolId = undefined;
  }
  return poolId;
};

export const safeGetEntry = (entry) => {
  if (!!entry || typeof entry === 'undefined' || entry === 'null') {
    return undefined;
  }
  return entry.replace(/"/g, '');
};

export const csvToCodes = (csv) => {
  const lines = csv.replace(/\r/g, '').split('\n');
  return lines
    .map((line) => {
      const entries = line.split(',');
      return {
        id: safeGetEntry(entries[0]),
        platform: safeGetEntry(entries[1]),
        addedBy: safeGetEntry(entries[2]),
        addedOn: safeGetEntry(entries[3]),
        grantedTo: safeGetEntry(entries[4]),
        grantedBy: safeGetEntry(entries[5]),
        grantedOn: safeGetEntry(entries[6]),
        code: safeGetEntry(entries[7]),
      };
    })
    .filter((code) => code.code);
};

export const determineTweetType = (tweet) => {
  if (tweet.in_reply_to_status_id) {
    return 'reply';
  }
  if (tweet.quoted_status_id) {
    return 'quote';
  }
  if (tweet.retweeted_status) {
    return 'retweet';
  }
  return 'tweet';
};

/**
 * Safely get matches from a string for the given RegExp
 * @param  {string} str   string to get matches from
 * @param  {RegExp} regex regex to match
 * @returns {string[]}       Array of matches, potentially empty
 */
export const safeMatch = (str, regex) => str.match(regex) || [];

export const getMessage = async (message, otherMessageId) => {
  const msgResults = [];
  message.guild.channels.each((channel) => {
    msgResults.push(channel.messages.fetch(otherMessageId));
  });

  return (await Promise.all(msgResults)).filter((fetched) => fetched)[0];
};

/**
 * Group an array by a field value
 * @param  {Object[]} array array of objects to group
 * @param  {string} field field to group by
 * @returns {Object}       [description]
 */
export const groupBy = (array, field) => {
  const grouped = {};
  array.forEach((item) => {
    const fVal = item[field];
    if (!grouped[fVal]) {
      grouped[fVal] = [];
    }
    grouped[fVal].push(item);
  });
  return grouped;
};

const giveawayDefaults = {
  messages: {
    giveaway: `${getEmoji('yay')}  **GIVEAWAY**  ${getEmoji('yay')}`,
    giveawayEnded: `${getEmoji('yay')}  **GIVEAWAY ENDED**  ${getEmoji('yay')}`,
    timeRemaining: 'Time remaining: **{duration}**!',
    inviteToParticipate: 'React with 🎉 to participate!',
    winMessage: 'Congratulations, {winners}! You won **{prize}**!',
    embedFooter: 'Giveaways',
    noWinner: 'Giveaway cancelled, no valid participants.',
    winners: 'winner(s)',
    endedAt: 'Ended at',
    units: {
      seconds: 's',
      minutes: 'm',
      hours: 'h',
      days: 'd',
    },
  },
};

export const toTitleCase = (str) => (str ?? '')?.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

/**
 * Map an asset path to the cdn url it applies to
 * @param {string} assetPath to the asset cdn location
 * @returns {string} asset url on the cdn
 */
export const cdn = (assetPath) => `${assetBase}${assetBase.endsWith('/') ? '' : '/'}${assetPath}`;

const cdnOrigin = apiCdnBase.replace(/\/$/, '');

/** warframe-items imageName → CDN img URL (warframe-hub wfcdn). */
export const wfcdn = (imgName: string) => `${cdnOrigin}/img/${imgName}`;

/**
 * Caravaggio proxy URL (warframe-hub optimize).
 * @see https://github.com/wfcd/warframe-hub/blob/master/services/utilities.js
 */
export const optimizeImage = (img: string, size?: number, mode: string = 'fit', direction: string = 'auto') => {
  const fsize = size ? `rs_${size}_${mode}_${direction},` : '';
  return `${cdnOrigin}/${fsize}o_webp,progressive_true/${img}`;
};

/** Item image for embeds; resized webp by default for Discord thumbnails. */
export const itemImageUrl = (imageName: string, size = 128) => optimizeImage(wfcdn(imageName), size);

/** Resolve warframe-items imageName → Caravaggio URL via items search. */
export const resolveItemImageUrl = async (itemName: string, size?: number) => {
  const query = itemName?.trim();
  if (!query) return '';

  const results = (await fetch(`${apiBase}/items/search/${encodeURIComponent(query.toLowerCase())}/?language=en`).then(
    (d) => d.json()
  )) as Array<{ name?: string; imageName?: string }>;

  if (!results?.length) return '';

  const match = results.find((r) => r.name === query) ?? results[0];
  if (!match?.imageName) return '';

  return size ? itemImageUrl(match.imageName, size) : optimizeImage(wfcdn(match.imageName));
};

/**
 * Common functions for determining common functions
 * @typedef {Object} CommonFunctions
 *
 * @property {function} createGroupedArray create an array of arrays grouped to specified amount
 */
export default {
  createGroupedArray,
  emojify,
  emojifyDtTags,
  fromNow,
  getChannel,
  getChannels,
  getEmoji,
  getEventsOrItems,
  getTarget,
  sendTrackInstructionEmbeds,
  getUsersForCall,
  timeDeltaToString,
  timeDeltaToMinutesString,
  trackablesFromParameters,
  isVulgarCheck,
  getRandomWelcome,
  resolveRoles,
  resolvePool,
  setupPages,
  createPageCollector,
  csvToCodes,
  determineTweetType,
  apiBase,
  assetBase,
  wikiBase,
  captures,
  apiCdnBase,
  wfcdn,
  optimizeImage,
  itemImageUrl,
  resolveItemImageUrl,
  chunkify,
  createChunkedEmbed,
  chunkFields,
  fieldLimit,
  embedDefaults,
  trackableEvents,
  trackableItems,
  constructItemEmbeds,
  constructTypeEmbeds,
  checkAndMergeEmbeds,
  ensureEmbedsWithinLimit,
  estimateEmbedSize,
  splitEmbedByCharLimit,
  EMBED_CHAR_LIMIT,
  EMBED_CHAR_SAFE,
  EMBED_FIELD_COUNT_MAX,
  EMBED_FIELD_NAME_LIMIT,
  EMBED_FIELD_VALUE_LIMIT,
  sanitizeEmbedField,
  platforms,
  safeMatch,
  getMessage,
  groupBy,
  games,
  giveawayDefaults,
  markdinate,
  toTitleCase,
  withEphemeral,
};
