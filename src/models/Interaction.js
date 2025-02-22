export default class Interaction {
  static enabled = true;

  /**
   * Command manifest for this application
   * @type {Discord.ApplicationCommandData}
   */
  static command = {
    name: 'interaction',
    description: 'Base interaction class',
    options: [],
  };

  /**
   * optional list of multiple commands to concat to the list instead of {@link #command}
   * @type {Array<Discord.ApplicationCommandData>}
   */
  static commands = undefined;

  /**
   * Handle a command interaction
   * @param {Discord.CommandInteraction} interaction interaction to handle
   * @param {Discord.CommandContext} ctx command context
   * @returns {Promise<Discord.Message | Discord.MessagePayload>}
   */
  // eslint-disable-next-line no-unused-vars,no-empty-function
  static async commandHandler(interaction, ctx) {}
}
