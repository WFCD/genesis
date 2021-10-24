'use strict';

const fetch = require('../../resources/Fetcher');

module.exports = class Corgi extends require('../../models/Interaction') {
  static enabled = true;

  static command = {
    name: 'corgi',
    description: 'Get a corgi picture!',
  };

  static async commandHandler(interaction) {
    const corgi = await fetch('https://dog.ceo/api/breed/corgi/cardigan/images/random');
    if (corgi) {
      return interaction.reply({
        files: [{
          attachment: corgi.message,
          name: `corgi.${corgi.message.split('.').pop()}`,
        }],
      });
    }
    return interaction.reply('couldn\'t find a corgi... :(');
  }
};
