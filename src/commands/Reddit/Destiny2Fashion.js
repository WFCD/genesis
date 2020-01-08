'use strict';

class Destiny2Fashion extends require('./BaseReddit') {
  constructor(bot) {
    super(bot, 'reddit.destiny.fashion', 'd2fashion', 'Generates a random outfit from destiny r/destiny2names', 'DESTINY2', 'DestinyFashion');
  }
}

module.exports = Destiny2Fashion;
