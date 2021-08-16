'use strict';

// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { Message, APIMessage, CommandInteraction } = Discord;

module.exports = class Interaction {
  static enabled = true;
  /**
   * @type {Discord.ApplicationCommandData}
   */
  static command = {
    name: 'interaction',
    description: 'Base interaction class',
    options: [],
  };
  static buttonHandler;
  static msgComponentHandler;
  static selectMenuHandler;

  /**
   *Handle a command interaction
   * @param {CommandInteraction} interaction interaction to handle
   * @param {CommandContext} ctx command context
   * @returns {Promise<Message | APIMessage>}
   */
  // eslint-disable-next-line no-unused-vars,no-empty-function
  static async commandHandler(interaction, ctx) {}
};
