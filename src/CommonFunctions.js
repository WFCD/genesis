'use strict';

const { Collection, MessageEmbed } = require('discord.js');
const emoji = require('./resources/emoji.json');
const welcomes = require('./resources/welcomes.json');

const {
  eventTypes, rewardTypes, opts, fissures, syndicates, twitter, conclave, deals, clantech,
  resources,
} = require('./resources/trackables.json');

const apiBase = process.env.API_BASE_PATH || 'https://api.warframestat.us';
const assetBase = process.env.ASSET_BASE_PATH || 'https://cdn.warframestat.us/genesis';
const wikiBase = process.env.WIKIA_BASE_PATH || 'https://warframe.fandom.com/wiki/';
const apiCdnBase = process.env.CDN_BASE_PATH || 'https://cdn.warframestat.us/';

const isVulgarCheck = new RegExp('(n[i!1]gg[e3]r|n[i!1]gg[ua]|h[i!1]tl[e3]r|n[a@]z[i!1]|[©ck]un[t7]|fu[©c]k|[©ck]umm?|f[a@4]g|d[i!1]ck|c[o0]ck|boner|sperm|gay|gooch|jizz|pussy|penis|r[i!1]mjob|schlong|slut|wank|whore|sh[i!1]t|sex|fuk|heil|p[o0]rn|pronz|suck|rape|scrotum)', 'ig');

const captures = {
  channel: '(?:(?:<#)?(\\d+)(?:>)?)',
  role: '(?:(?:<@&)?(\\d+)(?:>)?)',
  user: '(?:(?:<@!?)?(\\d+)(?:>)?)',
  trackables: `(solaris\\.warm\\.[0-9]?[0-9]|solaris\\.cold\\.[0-9]?[0-9]|cetus\\.day\\.[0-1]?[0-9]?[0-9]?|cetus\\.night\\.[0-1]?[0-9]?[0-9]?|${eventTypes.join('|')}|${rewardTypes.join('|')}|${opts.join('|')})`,
  platforms: '(pc|ps4|xb1|swi)',
};

const duration = {
  minute: 60,
  hour: 60 * 60,
  day: 60 * 60 * 24,
};

const fissureList = filter => fissures.filter(fissure => fissure.includes(filter));

const trackableEvents = {
  events: eventTypes,
  'fissures.t1': fissureList('fissures.t1'),
  'fissures.t2': fissureList('fissures.t2'),
  'fissures.t3': fissureList('fissures.t3'),
  'fissures.t4': fissureList('fissures.t4'),
  'fissures.excavation': fissureList('excavation'),
  'fissures.sabotage': fissureList('sabotage'),
  'fissures.mobiledefense': fissureList('mobiledefense'),
  'fissures.assassination': fissureList('assassination'),
  'fissures.exterminate': fissureList('exterminate'),
  'fissures.hive': fissureList('hive'),
  'fissures.defense': fissureList('defense'),
  'fissures.interception': fissureList('interception'),
  'fissures.rathuum': fissureList('rathuum'),
  'fissures.conclave': fissureList('conclave'),
  'fissures.rescue': fissureList('rescue'),
  'fissures.spy': fissureList('spy'),
  'fissures.survival': fissureList('survival'),
  'fissures.capture': fissureList('capture'),
  'fissures.darksector': fissureList('darksector'),
  'fissures.hijack': fissureList('hijack'),
  'fissures.assault': fissureList('assault'),
  'fissures.evacuation': fissureList('evacuation'),
  fissures,
  syndicates,
  conclave,
  deals,
  cetus: ['cetus.day', 'cetus.night'],
  earth: ['earth.day', 'earth.night'],
  'twitter.reply': eventTypes.filter(event => /twitter\.\w*\.reply/.test(event)),
  'twitter.tweet': eventTypes.filter(event => /twitter\.\w*\.tweet/.test(event)),
  'twitter.retweet': eventTypes.filter(event => /twitter\.\w*\.retweet/.test(event)),
  'twitter.quote': eventTypes.filter(event => /twitter\.\w*\.quote/.test(event)),
  twitter,
};

const trackableItems = {
  items: rewardTypes,
  clantech,
  resources,
};

/**
 * Get the trackable events and items based on the parameter
 * @param {string} term Term to convert to trackable
 * @returns {Object}
 */
const termToTrackable = (term) => {
  const cetusCustomTimeRegex = new RegExp('cetus\\.(day|night)\\.[0-1]?[0-9]?[0-9]?', 'ig');
  const earthCustomTimeRegex = new RegExp('earth\\.(day|night)\\.[0-1]?[0-9]?[0-9]?', 'ig');
  const solarisCustomTimeRegex = new RegExp('solaris\\.(warm|cold)\\.[0-9]?[0-9]?', 'ig');

  const trackable = {
    events: [],
    items: [],
  };

  if (cetusCustomTimeRegex.test(term)
    || earthCustomTimeRegex.test(term)
    || solarisCustomTimeRegex.test(term)) {
    trackable.events = term;
    return trackable;
  }

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
  return undefined;
};

/**
 * Find trackables based on the parameters
 * @param {Array<string>} params List of terms to find trackables for
 * @returns {Object}
 */
const trackablesFromParameters = (params) => {
  const trackables = {
    events: [],
    items: [],
  };
  let terms;
  if (params.length) {
    terms = params.map(term => term.trim()).filter(Boolean);
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

const eventsOrItems = new RegExp(captures.trackables, 'ig');

const getRandomWelcome = () => welcomes[Math.floor(Math.random() * welcomes.length)];

const createGroupedArray = (arr, chunkSize) => {
  const groups = [];
  for (let i = 0; i < arr.length; i += (chunkSize || 10)) {
    groups.push(arr.slice(i, i + (chunkSize || 10)));
  }
  return groups;
};

function getEventsOrItems(message) {
  const matches = message.strippedContent.match(eventsOrItems);
  return matches || [];
}

function getTrackInstructionEmbed(message, prefix, call) {
  const embed = {
    type: 'rich',
    color: 0x0000ff,
    fields: [
      {
        name: `${prefix}${call} <event(s)/item(s) to ${call === 'untrack' ? 'un' : ''}track>`,
        value: 'Track events/items to be alerted in this channel.',
        inline: true,
      },
      {
        name: 'Possible values:',
        value: '\u200B',
        inline: false,
      },
    ],
  };

  createGroupedArray(eventTypes, 35)
    .forEach((group, index) => embed.fields.push({
      name: `**Events${index > 0 ? ' cont\'d.' : ''}:**`,
      value: group.join(' '),
      inline: true,
    }));

  embed.fields.push({
    name: '**Rewards:**',
    value: rewardTypes.join(' '),
    inline: true,
  });
  embed.fields.push({
    name: 'Optional Groups:',
    value: opts.join(' '),
    inline: true,
  });

  switch (call) {
    case 'track':
      embed.fields[0].value = 'Track events/items to be alerted in this channel.';
      break;
    case 'untrack':
      embed.fields[0].value = 'Untrack events/items to be alerted in this channel.';
      break;
    case 'set ping':
      embed.fields[0].value = 'Set the text added before an event/item notification.';
      embed.fields.push({
        name: '**Ping:**',
        value: 'Whatever string you want to be added before a notification for this item or event. If you leave this blank, the ping for this item/event will be cleared',
        inline: true,
      });
      break;
    default:
      break;
  }
  return embed;
}

const emojify = (stringWithoutEmoji) => {
  let stringWithEmoji = stringWithoutEmoji;
  Object.keys(emoji).forEach((identifier) => {
    if (typeof stringWithEmoji === 'string') {
      stringWithEmoji = stringWithEmoji
        .replace(/<DT_\w+>/ig, '')
        .replace(new RegExp(`${identifier}`, 'ig'), ` ${emoji[identifier]} `);
    }
  });
  return stringWithEmoji;
};

const getEmoji = identifier => emoji[identifier] || '';

/**
 * @param   {number} millis The number of milliseconds in the time delta
 * @returns {string}
 */
const timeDeltaToString = (millis) => {
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

const timeDeltaToMinutesString = (millis) => {
  if (typeof millis !== 'number') {
    throw new TypeError('millis should be a number');
  }
  const timePieces = [];
  const prefix = millis < 0 ? '-' : '';
  let seconds = Math.abs(millis / 1000);

  if (seconds >= duration.minute) {
    timePieces.push(`${Math.floor(seconds / duration.minute)}m`);
    seconds = Math.floor(seconds) % duration.minute;
  }

  return `${prefix}${timePieces.join(' ')}`;
};

/**
 * Returns the number of milliseconds between now and a given date
 * @param   {Date} d         The date from which the current time will be subtracted
 * @param   {function} [now] A function that returns the current UNIX time in milliseconds
 * @returns {number}
 */
const fromNow = (d, now = Date.now) => d.getTime() - now();

/**
 * Get the list of channels to enable commands in based on the parameters
 * @param {string|Array<Channel>} channelsParam parameter for determining channels
 * @param {Message} message Discord message to get information on channels
 * @param {Collection.<Channel>} channels Channels allowed to be searched through
 * @returns {Array<string>} channel ids to enable commands in
 */
const getChannel = (channelsParam, message, channels) => {
  let { channel } = message;
  let channelsColl;
  if (message.guild) {
    channelsColl = message.guild.channels;
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
 * @param {Message} message Discord message to get information on channels
 * @returns {Array<string>} channel ids to enable commands in
 */
const getChannels = (channelsParam, message) => {
  let channels = [];
  // handle it for strings
  if (channelsParam !== 'all' && channelsParam !== 'current' && channelsParam !== '*') {
    channels.push(message.guild.channels.get(channelsParam.trim().replace(/(<|>|#)/ig, '')));
  } else if (channelsParam === 'all' || channelsParam === '*') {
    channels = channels.concat(message.guild.channels.array().filter(channel => channel.type === 'text'));
  } else if (channelsParam === 'current') {
    channels.push(message.channel);
  }
  return channels;
};

/**
 * Get the target role or user from the parameter string
 *    or role mentions or user mentions, preferring the latter 2.
 * @param {string} targetParam string from the command to determine the user or role
 * @param {Array<Role>} roleMentions role mentions from the command
 * @param {Array<User>} userMentions user mentions from the command
 * @param {Message} message message to get information on users and roles
 * @returns {Role|User} target or user to disable commands for
 */
const getTarget = (targetParam, roleMentions, userMentions, message) => {
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
    const userTarget = message.guild.members.get(targetParam);
    const roleTarget = message.guild.roles.get(targetParam);
    if (targetParam === '*') {
      target = message.guild.defaultRole;
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

const resolveRoles = ({ mentions = undefined, content = '', guild = undefined }) => {
  let roles = [];
  if (mentions && mentions.roles) {
    roles = roles.concat(mentions.roles.array());
  }
  const roleRegex = /(\d{16,19})/g;
  let matches = content.match(roleRegex);
  if (matches && matches.length) {
    matches.slice(0, 1);
    matches = matches.map((match) => {
      if (guild.roles.has(match)) {
        return guild.roles.get(match);
      }
      return undefined;
    }).filter(match => typeof match !== 'undefined');
  }

  if (matches) {
    roles = [...roles, ...matches];
  }
  return roles;
};

/**
 * Gets the list of users from the mentions in the call
 * @param {Message} message Channel message
 * @param {boolean} excludeAuthor whether or not to exclude the author in the list
 * @returns {Array.<User>} Array of users to send message
 */
const getUsersForCall = (message, excludeAuthor) => {
  const users = [];
  if (message.mentions.roles) {
    message.mentions.roles.forEach(role => role.members.forEach(member => users.push(member.user)));
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

const resolvePool = async (message, settings,
  {
    explicitOnly = false,
    skipManages = false,
    pool = undefined,
    checkRestriction = false,
    allowMultiple = false,
  } = { explicitOnly: false, skipManages: false }) => {
  let poolId = pool;
  if (!skipManages && !await settings.userManagesPool(message.author, poolId)) {
    poolId = undefined;
  } else {
    return poolId;
  }
  const explicitPoolMatches = message.strippedContent.match(/(?:--pool\s+([a-zA-Z0-9-]*))/i);

  if (!poolId && explicitPoolMatches && explicitPoolMatches.length > 1) {
    [, poolId] = explicitPoolMatches;
    if (!skipManages && !(await settings.userManagesPool(message.author, poolId))) {
      poolId = undefined;
    }
  } else if (!explicitOnly) {
    let pools = (await settings.getPoolsUserManages(message.author))
      .map(poolRow => poolRow.pool_id);
    if (pools.length > 1 && allowMultiple) {
      return pools;
    }
    if (pools.length === 1) {
      [poolId] = pools;
    } else if (pools.length === 0) {
      poolId = undefined;
    } else if (await settings.getGuildsPool(message.guild).length) {
      pools = await settings.getGuildsPool(message.guild);
      if (pools.length === 1
        && (skipManages || await settings.userManagesPool(message.author, pools[0]))) {
        [poolId] = pools;
      }
    } else {
      poolId = undefined;
    }
  }

  if (poolId && checkRestriction && await settings.isPoolRestricted(poolId)) {
    poolId = undefined;
  }
  return poolId;
};

const createPageCollector = async (msg, pages, author) => {
  if (pages.length <= 1) return;

  let page = 1;
  await msg.react('⏮');
  await msg.react('◀');
  await msg.react('⏹');
  await msg.react('▶');
  await msg.react('⏭');
  const collector = msg.createReactionCollector((reaction, user) => ((['◀', '▶', '⏮', '⏭', '⏹'].includes(reaction.emoji.name)) && user.id === author.id), { time: 600000 });
  const timeout = setTimeout(() => { msg.reactions.removeAll(); }, 601000);

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
      case '⏹':
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
            newPage.setFooter(`${pageInd} • ${newPage.footer.text}`, newPage.footer.icon_url);
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
      msg.edit({ embed: newPage });
    } else if (page < 1) {
      page = 1;
    } else if (page > pages.length) {
      page = pages.length;
    }
  });
};

const setupPages = async (pages, { message, settings, mm }) => {
  if (pages.length) {
    const msg = await mm.embed(message, pages[0], false, false);
    await createPageCollector(msg, pages, message.author);
  }
  if (parseInt(await settings.getChannelSetting(message.channel, 'delete_after_respond'), 10) && message.deletable) {
    message.delete({ timeout: 10000 });
  }
};

const safeGetEntry = (entry) => {
  if (entry === null || typeof entry === 'undefined' || entry === 'null') {
    return null;
  }
  return entry.replace(/"/g, '');
};

const csvToCodes = (csv) => {
  const lines = csv.replace(/\r/g, '').split('\n');
  return lines.map((line) => {
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
  }).filter(code => code.code !== null);
};

const determineTweetType = (tweet) => {
  if (tweet.in_reply_to_status_id) {
    return ('reply');
  }
  if (tweet.quoted_status_id) {
    return ('quote');
  }
  if (tweet.retweeted_status) {
    return ('retweet');
  }
  return ('tweet');
};

module.exports = {
  createGroupedArray,
  emojify,
  fromNow,
  getChannel,
  getChannels,
  getEmoji,
  getEventsOrItems,
  getTarget,
  getTrackInstructionEmbed,
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
};
