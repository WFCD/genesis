import fetch from 'node-fetch';
import Interaction from '../../models/Interaction.js';
import { cmds } from '../../resources/index.js';

export default class Corgi extends Interaction {
  static enabled = true;

  static command = cmds.corgi;

  static async commandHandler(interaction, ctx) {
    const corgi = await fetch('https://dog.ceo/api/breed/corgi/cardigan/images/random').then((d) => d.json());
    if (corgi) {
      return interaction.reply({
        files: [
          {
            attachment: corgi.message,
            name: `corgi.${corgi.message.split('.').pop()}`,
          },
        ],
      });
    }
    return interaction.reply(ctx.i18n`couldn't find a corgi... :(`);
  }
}
