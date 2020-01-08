'use strict';

class Destiny2Meme extends require('./BaseReddit') {
  constructor(bot) {
    super(bot, 'reddit.destiny.meme', 'd2meme', 'Generates a Destiny 2 meme', 'DESTINY2', 'DestinyMemes');
    this.enabled = true;
  }
}

module.exports = Destiny2Meme;
