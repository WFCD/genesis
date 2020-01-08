'use strict';

class DankMeme extends require('./BaseReddit') {
  constructor(bot) {
    super(bot, 'reddit.fun.meme', 'meme', 'Generates a random meme from r/dankmemes', 'FUN', 'dankmemes');
    this.enabled = true;
  }
}

module.exports = DankMeme;
