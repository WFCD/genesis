import Interaction from './Interaction.js';

const URL_RE = /(https?:\/\/[^\s]+)/;

export default ({ call, response, guildId }) =>
  class CustomInteraction extends Interaction {
    static guildId = guildId;
    static command = {
      name: call.toLowerCase().replace(/_-\W\s/, ''),
      description: `Custom command answering to ${call}`,
    };
    static async commandHandler(interaction, ctx) {
      const isSingleImg =
        response.match(URL_RE) &&
        response.match(URL_RE).length === 2 &&
        response.split(' ').length === 1 &&
        !(response.startsWith('<') && response.endsWith('>')) &&
        (response.endsWith('.png') ||
          response.endsWith('.webp') ||
          response.endsWith('.jpg') ||
          response.endsWith('.jpeg') ||
          response.endsWith('.webm') ||
          response.endsWith('.webm'));
      if (isSingleImg) {
        return interaction.reply({ files: [response], ephemeral: ctx.ephemerate });
      }
      return interaction.reply({ content: response, ephemeral: ctx.ephemerate });
    }
  };
