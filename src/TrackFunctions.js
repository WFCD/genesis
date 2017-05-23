'use strict';

const eventTypes = require('./resources/trackables.json').eventTypes;
const rewardTypes = require('./resources/trackables.json').rewardTypes;

function trackablesFromParameters (paramString) {
  const items = paramString.split(' ');

  const trackables = {
    events: [],
    items: [],
  }

  if (items[0].toLowerCase() === 'all') {
    trackables.events = trackables.events.concat(eventTypes);
    trackables.items = trackables.items.concat(rewardTypes);
  } else {
    items.forEach((item) => {
      if (item.toLowerCase() === 'items') {
        trackables.items = trackables.items.concat(rewardTypes);
      } else if (item.toLowerCase() === 'events') {
        trackables.events = trackables.events.concat(eventTypes);
      } else if (item.toLowerCase === 'fissures') {
        trackables.events = trackables.events.concat([ 'fissures.t1', 'fissures.t2', 'fissures.t3', 'fissures.t4' ]);
      } else if (item.toLowerCase === 'syndicates') {
        trackables.events = trackables.events.concat([ 'syndicate.arbiters', 'syndicate.suda', 'syndicate.loka', 'syndicate.perrin', 'syndicate.veil', 'syndicate.meridian' ]);
      } else if (item.toLowerCase === 'conclave') {
        trackables.events = trackables.events.concat([ 'conclave.weeklies', 'conclave.dailies' ]);
      } else if (item.toLowerCase === 'deals') {
        trackables.events = trackables.events.concat([ "deals.featured", "deals.popular"  ]);
      } else if (rewardTypes.includes(item.trim()) && saveTrack) {
        trackables.items.push(item.trim());
      } else if (eventTypes.includes(item.trim()) && saveTrack) {
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
        inline: true,
      },
      {
        name: '**Events:**',
        value: `${eventTypes.join('\n')}\nall\nevents`,
        inline: true,
      },
      {
        name: '**Rewards:**',
        value: `${rewardTypes.join('\n')}\nall\nitems`,
        inline: true,
      },
    ],
  };
  
  switch (call) {
    case 'track':
      embed.fields[0].value = 'Track events/items to be alerted in this channel.'
      break;
    case 'untrack':
      embed.fields[0].value = 'Untrack events/items to be alerted in this channel.'
      break;
    case 'set ping':
      embed.fields[0].value = 'Set the text added before an event/item notification.'
      embed.fields.push({
        name: '**Ping:**',
        value: 'Whatever string you want to be added before a notification for this item or event. If you leave this blank, the ping for this item/event will be cleared',
        inline: true,
      });
      break;
  }
  return embed;
}

module.exports = { trackablesFromParameters, getTrackInstructionEmbed };
