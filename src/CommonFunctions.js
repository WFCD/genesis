'use strict';

const { Collection } = require('discord.js');
const { eventTypes, rewardTypes, opts } = require('./resources/trackables.json');

const apiBase = process.env.API_BASE_PATH || 'https://api.warframestat.us';

const fissures = ['fissures.t1.excavation', 'fissures.t1.sabotage', 'fissures.t1.mobiledefense', 'fissures.t1.assassination', 'fissures.t1.exterminate',
  'fissures.t1.hive', 'fissures.t1.defense', 'fissures.t1.interception', 'fissures.t1.rathuum', 'fissures.t1.conclave', 'fissures.t1.rescue',
  'fissures.t1.spy', 'fissures.t1.survival', 'fissures.t1.capture', 'fissures.t1.darksector', 'fissures.t1.hijack', 'fissures.t1.assault',
  'fissures.t1.evacuation', 'fissures.t2.excavation', 'fissures.t2.sabotage', 'fissures.t2.mobiledefense', 'fissures.t2.assassination',
  'fissures.t2.exterminate', 'fissures.t2.hive', 'fissures.t2.defense', 'fissures.t2.interception', 'fissures.t2.rathuum', 'fissures.t2.conclave',
  'fissures.t2.rescue', 'fissures.t2.spy', 'fissures.t2.survival', 'fissures.t2.capture', 'fissures.t2.darksector', 'fissures.t2.hijack',
  'fissures.t2.assault', 'fissures.t2.evacuation', 'fissures.t3.excavation', 'fissures.t3.sabotage', 'fissures.t3.mobiledefense',
  'fissures.t3.assassination', 'fissures.t3.exterminate', 'fissures.t3.hive', 'fissures.t3.defense', 'fissures.t3.interception',
  'fissures.t3.rathuum', 'fissures.t3.conclave', 'fissures.t3.rescue', 'fissures.t3.spy', 'fissures.t3.survival', 'fissures.t3.capture',
  'fissures.t3.darksector', 'fissures.t3.hijack', 'fissures.t3.assault', 'fissures.t3.evacuation', 'fissures.t4.excavation', 'fissures.t4.sabotage',
  'fissures.t4.mobiledefense', 'fissures.t4.assassination', 'fissures.t4.exterminate', 'fissures.t4.hive', 'fissures.t4.defense',
  'fissures.t4.interception', 'fissures.t4.rathuum', 'fissures.t4.conclave', 'fissures.t4.rescue', 'fissures.t4.spy', 'fissures.t4.survival',
  'fissures.t4.capture', 'fissures.t4.darksector', 'fissures.t4.hijack', 'fissures.t4.assault', 'fissures.t4.evacuation'];

const syndicates = ['syndicate.arbiters', 'syndicate.suda', 'syndicate.loka', 'syndicate.perrin', 'syndicate.veil', 'syndicate.meridian', 'syndicate.ostrons', 'syndicate.assassins'];
const conclave = ['conclave.weeklies', 'conclave.dailies'];
const deals = ['deals.featured', 'deals.popular'];
const clantech = ['mutagen', 'fieldron', 'detonite'];
const resources = ['neuralSensors', 'orokinCell', 'alloyPlate', 'circuits', 'controlModule', 'ferrite', 'gallium', 'morphics', 'nanoSpores', 'oxium', 'rubedo', 'salvage', 'plastids', 'polymerBundle', 'argonCrystal', 'cryotic', 'tellurium'];

const emoji = {
  vazarin: '<:vazarin:319586146269003778>',
  madurai: '<:madurai:319586146499690496>',
  naramon: '<:naramon:319586146478850048>',
  zenurik: '<:zenurik:319586146197700610>',
  electricity: '<:electricity:321463957212626944>',
  cold: '<:cold:321463957019951105>',
  heat: '<:heat:321463957061763083>',
  toxin: '<:toxin:321463957325873153>',
  radiation: '<:radiation:321463957221277706>',
  viral: '<:viral:321463957292580864>',
  gas: '<:gas:363136257045561344>',
  impact: '<:impact:363136256781189120>',
  puncture: '<:puncture:363136257129185280>',
  slash: '<:slash:363136256755892225>',
  koneski: '<:koneski:319586146483044352>',
  unairu: '<:unairu:319586146453553162>',
  blast: '<:blast:363136256907149312>',
  corrosive: '<:corrosive:363136257288568832>',
  magnetic: '<:magnetic:363136420602445824>',
  umbra: '<:umbra:459116667255914496:>',
};

const isVulgarCheck = new RegExp('(n[i!1]gg[e3]r|n[i!1]gg[ua]|h[i!1]tl[e3]r|n[a@]z[i!1]|[©ck]un[t7]|fu[©c]k|[©ck]umm?|f[a@4]g|d[i!1]ck|c[o0]ck|boner|sperm|gay|gooch|jizz|pussy|penis|r[i!1]mjob|schlong|slut|wank|whore|sh[i!1]t|sex|fuk|heil|p[o0]rn|pronz|suck|rape|scrotum)', 'ig');

const welcomes = [
  '<:join:349556772412981269> **$username** just joined the server - glhf!',
  '<:join:349556772412981269> **$username** just joined. Everyone, look busy!',
  '<:join:349556772412981269> **$username** just joined. Can I get a heal?',
  '<:join:349556772412981269> **$username** joined your party.',
  '<:join:349556772412981269> **$username** joined. You must construct additional pylons.',
  '<:join:349556772412981269> Ermagherd. **$username** is here.',
  '<:join:349556772412981269> Welcome, **$username**. Stay awhile and listen.',
  '<:join:349556772412981269> Welcome, **$username**. We were expecting you ( ͡° ͜ʖ ͡°)',
  '<:join:349556772412981269> Welcome, **$username**. We hope you brought pizza.',
  '<:join:349556772412981269> Welcome **$username**. Leave your weapons by the door.',
  '<:join:349556772412981269> A wild **$username** appeared.',
  '<:join:349556772412981269> Swoooosh. **$username** just landed.',
  '<:join:349556772412981269> Brace yourselves. **$username** just joined the server.',
  '<:join:349556772412981269> **$username** just joined. Hide your bananas.',
  '<:join:349556772412981269> **$username** just arrived. Seems OP - please nerf.',
  '<:join:349556772412981269> **$username** just slid into the server.',
  '<:join:349556772412981269> A **$username** has spawned in the server.',
  '<:join:349556772412981269> Big **$username** showed up!',
  '<:join:349556772412981269> Where’s **$username**? In the server!',
  '<:join:349556772412981269> **$username** hopped into the server. Kangaroo!!',
  '<:join:349556772412981269> **$username** just showed up. Hold my beer.',
  '<:join:349556772412981269> Relax, **$username**, it\'s a party.',
  '<:join:349556772412981269> Behold before you, the courageous, the charismatic, fashionable...\n**$username**.',
  '<:join:349556772412981269> Oh **$username**, you\'re here! Good to see you weren\'t discouraged by fashion frame.',
  '<:join:349556772412981269> The Tenno **$username** has appeared.',
  '<:join:349556772412981269> **$username** has consigned to the Lotus.',
  '<:join:349556772412981269> **$username** has joined the fight against the Grineer!',
  '<:join:349556772412981269> **$username** has started praising Space Mom.',
  '<:join:349556772412981269> **$username** is ready to save us from Alad V',
  '<:join:349556772412981269> Vay Hek thinks he\'s won, but **$username** has joined',
  '<:join:349556772412981269> **$username** has drunk the Kuva',
  '<:join:349556772412981269> **$username** saved the Ostrons once again!',
  '<:join:349556772412981269> **$username** just arrived at the Community Discord Relay',
  '<:join:349556772412981269> Without **$username** we would\'ve lost the Relays',
  '<:join:349556772412981269> **$username** is a trained ninja at heart',
  '<:join:349556772412981269> **$username** is here, as the prophecy foretold.',
  '<:join:349556772412981269> Swaz-do-lah, **$username**!',
  '<:join:349556772412981269> **$username** has arrived, early lunch for Konzu!',
  '<:join:349556772412981269> **$username**? **$username**?! Ooh, is it my birth interval?',
  '<:join:349556772412981269> I\'m Cephalon Genesis Primary. We have and shall have a long association, **$username**.\nI know this conversation well.',
  '<:join:349556772412981269> Consequence to consequence brings you to us, **$username**',
  '<:join:349556772412981269> **$username**, you were anticipated. Our interaction begins.',
  '<:join:349556772412981269> Drop a stone, a ripple. Drop a grain, nothing of consequence.\nCome to me with stones, **$username**. Instruments of tested power, and I will accept.',
  '<:join:349556772412981269> Oh how I\'ve been looking all over for you, **$username**. Come, come! Let me show you my new venture. I think you\'ll be a perfect fit.',
  '<:join:349556772412981269> It is time. Utter the name, **$username**',
  '<:join:349556772412981269> Yes, the name I have always known, **$username**',
  '<:join:349556772412981269> I\'m detecting a large security force heading your way. It\'s the Gri... No wait, it\'s **$username**. Definitely  **$username**',
  '<:join:349556772412981269> They brought reinforcements... A **$username**',
];

const getRandomWelcome = () => welcomes[Math.floor(Math.random() * welcomes.length)];

function createGroupedArray(arr, chunkSize) {
  const groups = [];
  for (let i = 0; i < arr.length; i += (chunkSize || 10)) {
    groups.push(arr.slice(i, i + (chunkSize || 10)));
  }
  return groups;
}

function trackablesFromParameters(paramString) {
  let items = paramString;
  const cetusCustomTimeRegex = new RegExp('cetus\\.(day|night)\\.[0-1]?[0-9]?[0-9]?', 'ig');

  const trackables = {
    events: [],
    items: [],
  };

  if (items.length > 0) {
    items = items.map(item => item.trim()).filter(item => item.length > 0);
  } else {
    return trackables;
  }

  if (items[0] === 'all') {
    trackables.events = trackables.events.concat(eventTypes);
    trackables.items = trackables.items.concat(rewardTypes);
  } else {
    items.forEach((item) => {
      if (cetusCustomTimeRegex.test(item)) {
        trackables.events.push(item);
      } else if (item === 'items') {
        trackables.items = trackables.items.concat(rewardTypes);
      } else if (item === 'events') {
        trackables.events = trackables.events.concat(eventTypes);
      } else if (item === 'fissures.t1') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('fissures.t1')));
      } else if (item === 'fissures.t2') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('fissures.t2')));
      } else if (item === 'fissures.t3') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('fissures.t3')));
      } else if (item === 'fissures.t4') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('fissures.t4')));
      } else if (item === 'fissures.excavation') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('excavation')));
      } else if (item === 'fissures.sabotage') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('sabotage')));
      } else if (item === 'fissures.mobiledefense') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('mobiledefense')));
      } else if (item === 'fissures.assassination') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('assassination')));
      } else if (item === 'fissures.exterminate') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('exterminate')));
      } else if (item === 'fissures.hive') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('hive')));
      } else if (item === 'fissures.defense') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('defense')));
      } else if (item === 'fissures.interception') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('interception')));
      } else if (item === 'fissures.rathuum') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('rathuum')));
      } else if (item === 'fissures.conclave') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('conclave')));
      } else if (item === 'fissures.rescue') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('rescue')));
      } else if (item === 'fissures.spy') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('spy')));
      } else if (item === 'fissures.survival') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('survival')));
      } else if (item === 'fissures.capture') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('capture')));
      } else if (item === 'fissures.darksector') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('darksector')));
      } else if (item === 'fissures.hijack') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('hijack')));
      } else if (item === 'fissures.assault') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('assault')));
      } else if (item === 'fissures.evacuation') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('evacuation')));
      } else if (item === 'fissures') {
        trackables.events = trackables.events.concat(fissures);
      } else if (item === 'syndicates') {
        trackables.events = trackables.events.concat(syndicates);
      } else if (item === 'conclave') {
        trackables.events = trackables.events.concat(conclave);
      } else if (item === 'deals') {
        trackables.events = trackables.events.concat(deals);
      } else if (item === 'clantech') {
        trackables.items = trackables.items.concat(clantech);
      } else if (item === 'resources') {
        trackables.items = trackables.items.concat(resources);
      } else if (item === 'cetus') {
        trackables.events.push('cetus.day');
        trackables.events.push('cetus.night');
      } else if (rewardTypes.includes(item)) {
        trackables.items.push(item);
      } else if (eventTypes.includes(item)) {
        trackables.events.push(item);
      }
    });
  }
  return trackables;
}

const eventsOrItems = new RegExp(`cetus\\.day\\.[0-1]?[0-9]?[0-9]|cetus\\.night\\.[0-1]?[0-9]?[0-9]|${eventTypes.join('|')}|${rewardTypes.join('|')}|${opts.join('|')}`, 'ig');

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
        value: '_ _',
        inline: false,
      },
    ],
  };
  createGroupedArray(eventTypes, 35).forEach((group, index) => embed.fields.push({
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
        .replace(new RegExp(`${identifier}`, 'ig'), ` ${emoji[identifier]}`);
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

  // Seconds in a day
  if (seconds >= 86400) {
    timePieces.push(`${Math.floor(seconds / 86400)}d`);
    seconds = Math.floor(seconds) % 86400;
  }
  // Seconds in an hour
  if (seconds >= 3600) {
    timePieces.push(`${Math.floor(seconds / 3600)}h`);
    seconds = Math.floor(seconds) % 3600;
  }
  if (seconds >= 60) {
    timePieces.push(`${Math.floor(seconds / 60)}m`);
    seconds = Math.floor(seconds) % 60;
  }
  if (seconds >= 0) {
    timePieces.push(`${Math.floor(seconds)}s`);
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
  await msg.react('◀');
  await msg.react('▶');
  const collector = msg.createReactionCollector((reaction, user) => ((reaction.emoji.name === '◀' || reaction.emoji.name === '▶') && user.id === author.id), { time: 600000 });

  collector.on('collect', async (reaction) => {
    if (reaction.emoji.name === '◀') {
      if (page > 1) page -= 1;
    } else if (reaction.emoji.name === '▶') {
      if (page <= pages.length) page += 1;
    }
    await reaction.remove(author.id);
    if (page <= pages.length && page > 0) {
      const newPage = pages[page - 1];
      const pageInd = `Page ${page}/${pages.length}`;
      if (newPage.footer) {
        if (newPage.footer.text) {
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
    } else if (page >= pages.length) {
      page = pages.length;
    }
  });
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
  trackablesFromParameters,
  isVulgarCheck,
  getRandomWelcome,
  resolveRoles,
  resolvePool,
  createPageCollector,
  csvToCodes,
  apiBase,
};
