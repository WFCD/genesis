'use strict';

const Command = require('../../Command.js');

/**
 * Sets the current guild's custom prefix
 */
class Untrack extends Command {
  constructor(bot) {
    super(bot, 'core.info', 'info', 'Information about the bot');
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   * @returns {string} success status
   */
  async run(message) {
    this.messageManager.embed(message, {
      title: 'Cephalon Genesis',
      fields: [
        {
          name: '_ _',
          value: 'Feel free to check out [Genesis here](https://bots.discord.pw/bots/123591822579597315),' +
            '\nAs well as on the [help page](https://wfcd.github.io/genesis),' +
            '\nand come support Genesis, if you\'re interested, [on patreon](https://patreon.com/cephalongenesis).',
          inline: true,
        },
        {
          name: '_ _',
          value: 'For help information, type `/help`',
          inline: false,
        },
        {
          name: 'Authors',
          value: 'Tobiah/[aliasfalse](https://github.com/aliasfalse) and [nspace](https://github.com/nspacestd)',
        },
        {
          name: 'About',
          value: 'Cephalon Genesis exists to help Discord Tenno find all the information they need about Warframe that you might',
        },
      ],
      footer: {
        icon_url: 'https://cdn.discordapp.com/avatars/123591822579597315/f95aad1bc1eefcf7514649209fde9d97.png',
        text: 'Cephalon Genesis, now on more than 6300 guilds!',
      },
    }, true, false);
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = Untrack;
