'use strict';

const { eventTypes, rewardTypes } = require('./resources/trackables.json');

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

function trackablesFromParameters(paramString) {
  let items = paramString.split(' ');

  const trackables = {
    events: [],
    items: [],
  };

  if (items[0].toLowerCase() === 'all') {
    trackables.events = trackables.events.concat(eventTypes);
    trackables.items = trackables.items.concat(rewardTypes);
  } else {
    items = items.map(item => item.trim());
    items.forEach((item) => {
      const i = item.toLowerCase().trim();
      if (i === 'items') {
        trackables.items = trackables.items.concat(rewardTypes);
      } else if (i === 'events') {
        trackables.events = trackables.events.concat(eventTypes);
      } else if (i === 'fissures.t1') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('fissures.t1')));
      } else if (i === 'fissures.t2') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('fissures.t2')));
      } else if (i === 'fissures.t3') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('fissures.t3')));
      } else if (i === 'fissures.t4') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('fissures.t4')));
      } else if (i === 'fissures.excavation') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('excavation')));
      } else if (i === 'fissures.sabotage') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('sabotage')));
      } else if (i === 'fissures.mobiledefense') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('mobiledefense')));
      } else if (i === 'fissures.assassination') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('assassination')));
      } else if (i === 'fissures.extermination') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('extermination')));
      } else if (i === 'fissures.hive') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('hive')));
      } else if (i === 'fissures.defense') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('defense')));
      } else if (i === 'fissures.interception') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('interception')));
      } else if (i === 'fissures.rathuum') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('rathuum')));
      } else if (i === 'fissures.conclave') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('conclave')));
      } else if (i === 'fissures.rescue') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('rescue')));
      } else if (i === 'fissures.spy') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('spy')));
      } else if (i === 'fissures.survival') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('survival')));
      } else if (i === 'fissures.capture') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('capture')));
      } else if (i === 'fissures.darksector') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('darksector')));
      } else if (i === 'fissures.hijack') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('hijack')));
      } else if (i === 'fissures.assault') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('assault')));
      } else if (i === 'fissures.evacuation') {
        trackables.events = trackables.events
          .concat(fissures.filter(fissure => fissure.includes('evacuation')));
      } else if (i === 'fissures') {
        trackables.events = trackables.events.concat(fissures);
      } else if (i === 'syndicates') {
        trackables.events = trackables.events.concat(syndicates);
      } else if (i === 'conclave') {
        trackables.events = trackables.events.concat(conclave);
      } else if (i === 'deals') {
        trackables.events = trackables.events.concat(deals);
      } else if (i === 'clantech') {
        trackables.items = trackables.items.concat(clantech);
      } else if (i === 'resources') {
        trackables.items = trackables.items.concat(resources);
      } else if (rewardTypes.includes(item.trim())) {
        trackables.items.push(item.trim());
      } else if (eventTypes.includes(item.trim())) {
        trackables.events.push(item.trim());
      }
    });
  }
  return trackables;
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
      {
        name: '**Events:**',
        value: `${eventTypes.concat(['all', 'events', 'fissures', 'fissures.t1', 'fissures.t2', 'fissures.t3', 'fissures.t4', 'syndicates', 'conclave', 'deals']).join('\n')}`,
        inline: true,
      },
      {
        name: '**Rewards:**',
        value: `${rewardTypes.concat(['all', 'items', 'clantech', 'resources']).join('\n')}`,
        inline: true,
      },
    ],
  };

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

module.exports = { trackablesFromParameters, getTrackInstructionEmbed };
