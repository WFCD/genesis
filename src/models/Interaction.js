'use strict';

// eslint-disable-next-line no-unused-vars
const { Message, APIMessage } = require('discord.js');

module.exports = class Interaction {
  static enabled = false;
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
