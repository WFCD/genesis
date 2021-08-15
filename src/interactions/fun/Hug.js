'use strict';

const content = '```haskell\nOperator, Cephalons do not g-g-g-give huuuu~~ Screw it. ⊂（♡⌂♡）⊃```';

module.exports = class Hug extends require('../../models/Interaction') {
  static enabled = true;

  static command = {
    name: 'hug',
    description: 'Get a hug <3',
  };

  static async commandHandler(interaction, ctx) {
    return interaction.reply({ content, ephemeral: ctx.ephemerate });
  }
};
