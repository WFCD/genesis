import Interaction from '../../models/Interaction.js';
import fetch from '../../utilities/Fetcher.js';

export default class Corgi extends Interaction {
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
}
