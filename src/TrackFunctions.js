'use strict';

const eventTypes = require('./resources/trackables.json').eventTypes;
const rewardTypes = require('./resources/trackables.json').rewardTypes;

const fissures = ['fissures.t1', 'fissures.t2', 'fissures.t3', 'fissures.t4'];
const syndicates = ['syndicate.arbiters', 'syndicate.suda', 'syndicate.loka', 'syndicate.perrin', 'syndicate.veil', 'syndicate.meridian'];
const conclave = ['conclave.weeklies', 'conclave.dailies'];
const deals = ['deals.featured', 'deals.popular'];
const clantech = ['mutagen', 'fieldron', 'detonite'];

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
        value: `${eventTypes.concat(['all', 'events', 'fissures', 'syndicates', 'conclave', 'deals']).join('\n')}`,
        inline: true,
      },
      {
        name: '**Rewards:**',
        value: `${rewardTypes.concat(['all', 'items', 'clantech']).join('\n')}`,
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
