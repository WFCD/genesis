'use strict';

module.exports = class Runway extends require('./Reddit') {
  static enabled = false;
  static subreddit = 'warframerunway'
  static command = {
    name: 'fashion',
    description: 'Get a random Warframe fashion image',
  };
};
