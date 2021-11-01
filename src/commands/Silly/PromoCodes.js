'use strict';

const Command = require('../../models/Command.js');

const promoCodeEmbed = {
  title: 'Glyphs.wf',
  color: 7506394,
  url: 'https://glyphs.wf',
  description: 'No point in maintaining my own when this place does a great job of it.',
  footer: { text: 'Site maintained by Pegasy' },
};

/**
 * Promocodes
 */
class Jokes extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'silly.promocode', 'promocodes', 'Get promocodes', 'WARFRAME');
  }

  async run(message) {
    await message.reply({ embeds: [promoCodeEmbed] });
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Jokes;
