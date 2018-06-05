'use strict';

const Command = require('../../models/Command.js');

class AddPromocode extends Command {
  constructor(bot) {
    super(bot, 'glyphs.addCode', 'glyph add code', 'Add a glyph or prize code.');
    this.ownerOnly = true;
    this.regex = new RegExp(`^${this.call}\\s*(.*)?`, 'i');
  }

  async run(message) {
    // do nothing
    await this.messageManager.reply(message, message.content);
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = AddPromocode;
