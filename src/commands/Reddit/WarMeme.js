'use strict';

const Reddit = require('./BaseReddit');

/**
 * Displays a Warframe Meme from r/warframememes
 */
class WarMeme extends Reddit {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'reddit.warmeme', 'warmeme', 'Generates a random meme from r/warframememes', 'WARFRAME', 'warframememes');
    this.enabled = true;
  }
}

module.exports = WarMeme;
