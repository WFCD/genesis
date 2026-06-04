import type { ChatInputCommandInteraction } from 'discord.js';

import type { CommandContext } from '#shared/types/context';
import { withEphemeral } from '#shared/utilities/CommonFunctions';

import Interaction from './Interaction';

const URL_RE = /(https?:\/\/[^\s]+)/;

export interface CustomCommandDefinition {
  call: string;
  response: string;
  guildId: string;
}

export default ({ call, response, guildId }: CustomCommandDefinition) =>
  class CustomInteraction extends Interaction {
    static guildId = guildId;

    static command = {
      name: call.toLowerCase().replace(/_-\W\s/, ''),
      description: `Custom command answering to ${call}`,
    };

    static async commandHandler(interaction: ChatInputCommandInteraction, ctx: CommandContext) {
      const isSingleImg =
        response.match(URL_RE) &&
        response.match(URL_RE)!.length === 2 &&
        response.split(' ').length === 1 &&
        !(response.startsWith('<') && response.endsWith('>')) &&
        (response.endsWith('.png') ||
          response.endsWith('.webp') ||
          response.endsWith('.jpg') ||
          response.endsWith('.jpeg') ||
          response.endsWith('.webm') ||
          response.endsWith('.webm'));
      if (isSingleImg) {
        return interaction.reply(withEphemeral(ctx.ephemerate, { files: [response] }));
      }
      return interaction.reply(withEphemeral(ctx.ephemerate, { content: response }));
    }
  };
