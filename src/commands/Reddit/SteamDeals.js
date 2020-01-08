'use strict';

class SteamDeals extends require('./BaseReddit') {
  constructor(bot) {
    super(bot, 'reddit.fun.steamdeals', 'steamdeals', 'Generates a random steam deal from r/steamdeals', 'FUN', 'steamdeals');
    this.enabled = true;
  }
}

module.exports = SteamDeals;
