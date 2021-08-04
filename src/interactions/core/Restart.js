'use strict';

module.exports = class Restart extends require('../../models/Interaction') {
  static enabled = true;
  static ownerOnly = true;

  static command = {
    name: 'restart',
    description: 'Restart the bot [owner only]',
  };

  static async commandHandler(interaction) {
    try {
      await interaction.reply({ content: 'ok', ephemeral: true });
    } finally {
      process.exit(0);
    }
  }
};
