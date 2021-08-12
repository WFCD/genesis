'use strict';

// eslint-disable-next-line no-unused-vars
const Discord = require('discord.js');
// eslint-disable-next-line no-unused-vars
const { Message, APIMessage } = Discord;

module.exports = class Interaction {
  static enabled = false;
  /**
   *
   * @type {Discord.ApplicationCommandData}
   */
  static command = {
    name: 'Interaction',
    description: 'Base interaction class',
    options: [],
  };
  static buttonHandler;
  static msgComponentHandler;
  static selectMenuHandler;

  /**
   *Handle a command interaction
   * @param interaction
   * @returns {Promise<Message | APIMessage>}
   */
  // eslint-disable-next-line no-unused-vars,no-empty-function
  static async commandHandler(interaction) {}
};
