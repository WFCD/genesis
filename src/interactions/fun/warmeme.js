'use strict';

module.exports = class warmeme extends require('./Reddit') {
  static enabled = true;
  static subreddit = 'memeframe'
  static command = {
    name: 'memeframe',
    description: 'Get a Warframe meme',
  };
};
