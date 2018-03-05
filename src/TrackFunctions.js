'use strict';

const { eventTypes, rewardTypes, opts } = require('./resources/trackables.json');

const fissures = ['fissures.t1.excavation', 'fissures.t1.sabotage', 'fissures.t1.mobiledefense', 'fissures.t1.assassination', 'fissures.t1.extermination',
  'fissures.t1.hive', 'fissures.t1.defense', 'fissures.t1.interception', 'fissures.t1.rathuum', 'fissures.t1.conclave', 'fissures.t1.rescue',
  'fissures.t1.spy', 'fissures.t1.survival', 'fissures.t1.capture', 'fissures.t1.darksector', 'fissures.t1.hijack', 'fissures.t1.assault',
  'fissures.t1.evacuation', 'fissures.t2.excavation', 'fissures.t2.sabotage', 'fissures.t2.mobiledefense', 'fissures.t2.assassination',
  'fissures.t2.extermination', 'fissures.t2.hive', 'fissures.t2.defense', 'fissures.t2.interception', 'fissures.t2.rathuum', 'fissures.t2.conclave',
  'fissures.t2.rescue', 'fissures.t2.spy', 'fissures.t2.survival', 'fissures.t2.capture', 'fissures.t2.darksector', 'fissures.t2.hijack',
  'fissures.t2.assault', 'fissures.t2.evacuation', 'fissures.t3.excavation', 'fissures.t3.sabotage', 'fissures.t3.mobiledefense',
  'fissures.t3.assassination', 'fissures.t3.extermination', 'fissures.t3.hive', 'fissures.t3.defense', 'fissures.t3.interception',
  'fissures.t3.rathuum', 'fissures.t3.conclave', 'fissures.t3.rescue', 'fissures.t3.spy', 'fissures.t3.survival', 'fissures.t3.capture',
  'fissures.t3.darksector', 'fissures.t3.hijack', 'fissures.t3.assault', 'fissures.t3.evacuation', 'fissures.t4.excavation', 'fissures.t4.sabotage',
  'fissures.t4.mobiledefense', 'fissures.t4.assassination', 'fissures.t4.extermination', 'fissures.t4.hive', 'fissures.t4.defense',
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
};

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
    items = items.map(item => item.toLowerCase().trim()).filter(item => item.length > 0);
  } else {
    return trackables;
  }

  if (items[0].toLowerCase() === 'all') {
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
      } else if (item === 'fissures.extermination') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('extermination')));
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

function getEmoji(identifier) {
  return emoji[identifier] || '';
}

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

module.exports = {
  trackablesFromParameters,
  getTrackInstructionEmbed,
  createGroupedArray,
  getEmoji,
  timeDeltaToString,
  fromNow,
  getEventsOrItems,
};
