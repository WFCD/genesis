'use strict';

const Command = require('../../Command.js');

const promoCodeEmbed = {
	title: "Promocodes",
	color: 7506394,
	fields: [{
			name: "_ _",
			value: "[ADMIRALBAHROO](https://warframe.com/promocode?code=ADMIRALBAHROO) | [KINGGOTHALION](https://warframe.com/promocode?code=KINGGOTHALION) | [PROFESSORBROMAN](https://warframe.com/promocode?code=PROFESSORBROMAN) | [SP00NERISM](https://warframe.com/promocode?code=SP00NERISM) | [SUMMIT1G](https://warframe.com/promocode?code=SUMMIT1G) | [BIKEMAN](https://warframe.com/promocode?code=BIKEMAN) | [TACTICALPOTATO](https://warframe.com/promocode?code=TACTICALPOTATO) | [IFLYNN](https://warframe.com/promocode?code=IFLYNN) | [MOGAMU](https://warframe.com/promocode?code=MOGAMU)",
		}, {
			name: "_ _",
			value: "[SKILLUP](https://warframe.com/promocode?code=SKILLUP) | [ORIGINALWICKEDFUN](https://warframe.com/promocode?code=ORIGINALWICKEDFUN) | [MCGAMERCZ](https://warframe.com/promocode?code=MCGAMERCZ) | [HOMINVOCADO](https://warframe.com/promocode?code=HOMINVOCADO) | [MCIK](https://warframe.com/promocode?code=MCIK) | [TVSBOH](https://warframe.com/promocode?code=TVSBOH) | [BRICKY](https://warframe.com/promocode?code=BRICKY) | [NOOBLSHOWTEK](https://warframe.com/promocode?code=NOOBLSHOWTEK)",
		},
	],
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
    super(bot, 'silly.promocode', 'promocodes', 'Get promocodes');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    await this.messageManager.embed(message, promoCodeEmbed, true, true);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Jokes;
