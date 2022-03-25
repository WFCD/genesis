import Discord from 'discord.js';

const {
  // eslint-disable-next-line no-unused-vars
  Message, APIMessage, CommandInteraction,
} = Discord;

export default class Interaction {
  static enabled = true;
  /**
   * @type {Discord.ApplicationCommandData}
   */
  static command = {
    name: 'interaction',
    description: 'Base interaction class',
    options: [],
  };

  /**
   * Handle a command interaction
   * @param {CommandInteraction} interaction interaction to handle
   * @param {CommandContext} ctx command context
   * @returns {Promise<Message | APIMessage>}
   */
  // eslint-disable-next-line no-unused-vars,no-empty-function
  static async commandHandler(interaction, ctx) {}
}
