'use strict';

class Destiny2Names extends require('./BaseReddit') {
  constructor(bot) {
    super(bot, 'reddit.destiny.names', 'd2names', 'Generates a random funny destiny 2 name from r/destiny2names', 'DESTINY2', 'destiny2names');
    this.enabled = true;
  }
}

module.exports = Destiny2Names;
