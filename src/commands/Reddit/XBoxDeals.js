'use strict';

class XBoxDeals extends require('./BaseReddit') {
  constructor(bot) {
    super(bot, 'Reddit.xboxdeals', 'xboxdeals', 'Generates a random steam deal from r/xboxdeals', 'FUN', 'GreatXboxDeals');
    this.enabled = true;
  }
}

module.exports = XBoxDeals;
