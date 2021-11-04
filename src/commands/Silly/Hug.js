'use strict';

module.exports = class Hug extends require('../../models/Command.js') {
  constructor(bot) {
    super(bot, 'silly.hug', 'hug', 'Hug Genesis', 'FUN');
  }

  async run(message) {
    await message.reply('```haskell\nOperator, Cephalons do not g-g-g-give huuuu~~ Screw it. ⊂（♡⌂♡）⊃```');
    return this.constructor.statuses.SUCCESS;
  }
};
