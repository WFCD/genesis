import type {
  ChatInputCommandInteraction,
  InteractionResponse,
  Message,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';

import type { CommandContext } from '#shared/types/context';

export type InteractionCommandDefinition = Record<string, unknown> & {
  name: string;
  description: string;
};

export default class Interaction {
  static enabled = true;

  static command: InteractionCommandDefinition | undefined = {
    name: 'interaction',
    description: 'Base interaction class',
    options: [],
  };

  static commands?: (InteractionCommandDefinition | RESTPostAPIChatInputApplicationCommandsJSONBody)[];

  static elevated = false;

  static ownerOnly = false;

  static async commandHandler(
    _interaction: ChatInputCommandInteraction,
    _ctx: CommandContext
  ): Promise<Message | InteractionResponse | void> {}
}
