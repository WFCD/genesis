import Discord from 'discord.js';

import { emoji, factions, missionTypes, rssFeeds, trackables as all, welcomes } from '../resources/index.js';

import logger from './Logger.js';

const {
  clantech,
  conclave,
  deals,
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

const { Collection, MessageEmbed } = Discord;

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
export const trackableEvents = {
  events: eventTypes,
  syndicates,
  conclave,
  deals,
  cambion: ['cambion.fass', 'cambion.vome', 'necralisk'],
  cetus: ['cetus.day', 'cetus.night'],
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
  // These will be re-enabled when arbitrations/kuva are ready
  if (missionTypes[type].arbi) {
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
    icon_url: 'https://warframestat.us/wfcd_logo_color.png',
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
          string = string.replace(/\*\*(.*)\*\*\s*$/g, ''); // eslint-disable-line no-param-reassign
          breakIndex -= endTitle.length;
        }
      }

      newStrings.push(string.substring(0, breakIndex));
      // Skip char if split on line break
      if (breakIndex !== maxLength) {
        breakIndex += 1;
      }
      // eslint-disable-next-line no-param-reassign
      string = string.substring(breakIndex, string.length);
    }
  }
  newStrings.push(string);
  return newStrings;
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

const nav = ['◀', '▶', '⏮', '⏭', '🛑'];

/**
 * Create a page collector for the given message and pages
 * @param   {Discord.Message}                 msg     Message to start the page collector from
 * @param   {(Object|Discord.MessageEmbed)}   pages   Array of possible pages
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
        if (newPage instanceof MessageEmbed) {
          if (newPage.footer.text.indexOf('Page') === -1) {
            newPage.setFooter({ text: `${pageInd} • ${newPage.footer.text}`, iconURL: newPage.footer.icon_url });
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
 * @param  {Array.<Object|MessageEmbed>}  pages    Array of embeds to use as pages
 * @param  {Discord.Message}              message  Message for author
 * @param  {Settings}                     settings Settings
 */
export const setupPages = async (pages, { message, settings }) => {
  if (pages.length && !!(await message.fetch(true))) {
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
 * @returns {Discord.MessageEmbed}               Embed
 */
export const createChunkedEmbed = (stringToChunk, title, breakChar) => {
  const embed = new MessageEmbed(embedDefaults);
  embed.setTitle(title);
  const chunks = (chunkify({ string: stringToChunk, breakChar, maxLength: 900 }) || []).filter(stringFilter);
  if (chunks.length) {
    chunks.forEach((chunk, index) => {
      if (index > 0) {
        embed.addFields({ name: '\u200B', value: chunk, inline: true });
      } else {
        embed.setDescription(chunk);
      }
    });
  } else {
    embed.setDescription(`No ${title}`);
  }

  if (embed.fields.length > fieldLimit) {
    const fieldGroups = createGroupedArray(embed.fields, fieldLimit);
    const embeds = [];
    fieldGroups.forEach((fields, index) => {
      const smEmbed = new MessageEmbed(embedDefaults);
      embed.setTitle(title);

      smEmbed.fields = fields;
      if (index === 0) {
        smEmbed.setDescription(embed.description);
      }
      embeds.push(smEmbed);
    });
    return embeds;
  }
  return embed;
};

/**
 * Chunk fields
 * @param {Array<string>} valArr values to map
 * @param {string} [title] title to use
 * @param {string} [chunkStr] separator
 * @returns {Array.<Discord.EmbedField>}
 */
export const chunkFields = (valArr, title = 'Chunkeroo', chunkStr = '; ') => {
  const chunkified = chunkify({ string: valArr.join(chunkStr) });
  if (!chunkified) {
    return [];
  }
  return chunkified
    .map((val, ind) => {
      if (val && val.length) {
        return {
          name: `${title}${ind > 0 ? ', ctd.' : ''}`,
          value: val,
          inline: true,
        };
      }
      return undefined;
    })
    .filter((field) => field);
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
  const fieldGroups = createGroupedArray(fields, fieldLimit);
  return fieldGroups.map((fieldGroup, index) => {
    const embed = new MessageEmbed(embedDefaults);
    embed.setTitle(`Event Trackables${index > 0 ? ', ctd.' : ''}`);
    embed.addFields(
      fieldGroup.map((field) => ({
        ...field,
        inline: true,
      }))
    );
    return embed;
  });
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
  const fieldGroups = createGroupedArray(fields, fieldLimit);
  return fieldGroups.map((fieldGroup, index) => {
    const embed = new MessageEmbed(embedDefaults);
    embed.setTitle(`Item Trackables${index > 0 ? ', ctd.' : ''}`);
    embed.addFields(
      fieldGroup.map((field) => ({
        ...field,
        inline: true,
      }))
    );
    return embed;
  });
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

export const emojify = (stringWithoutEmoji) => {
  let stringWithEmoji = stringWithoutEmoji;
  Object.keys(emoji).forEach((identifier) => {
    if (typeof stringWithEmoji === 'string') {
      stringWithEmoji = stringWithEmoji
        .replace(/<DT_\w+>/gi, '')
        .replace(new RegExp(`${identifier}`, 'ig'), ` ${emoji[identifier]} `);
    }
  });
  return stringWithEmoji;
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
      // eslint-disable-next-line prefer-destructuring
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
      Array.from(message.guild.channels.cache.filter((channel) => channel.type === 'GUILD_TEXT'))
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
  let matches = content.match(roleRegex);
  if (matches && matches.length) {
    matches.slice(0, 1);
    matches = matches
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

export const toTitleCase = (str) => str.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());

/**
 * Map an asset path to the cdn url it applies to
 * @param {string} assetPath to the asset cdn location
 * @returns {string} asset url on the cdn
 */
export const cdn = (assetPath) => `${assetBase}${assetBase.endsWith('/') ? '' : '/'}${assetPath}`;

/**
 * Common functions for determining common functions
 * @typedef {Object} CommonFunctions
 *
 * @property {function} createGroupedArray create an array of arrays grouped to specified amount
 */
export default {
  createGroupedArray,
  emojify,
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
  platforms,
  safeMatch,
  getMessage,
  groupBy,
  games,
  giveawayDefaults,
  markdinate,
  toTitleCase,
};
