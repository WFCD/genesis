'use strict';

const Command = require('../../models/Command.js');
// const ProfileEmbed = require('../../embeds/ProfileEmbed.js');
//
// const inProgressEmbed = { title: 'Processing search...', color: 0xF1C40F };
// const offlineMessage = 'Profile Engine Offline. New Entries will not be processed.';

class PriceCheck extends Command {
  constructor(bot) {
    super(bot, 'warframe.misc.profile', 'profile', 'profile', 'WARFRAME');
    this.regex = new RegExp(`^${this.call}(?:\\s+(.+))?`, 'i');
    this.usages = [
      {
        description: 'Search for a player\'s profile',
        parameters: ['in-game name (PC only)'],
      },
    ];
    this.enabled = false;
  }

  async run() {
    return this.messageManager.statuses.FAILURE;
  }

  async sendUsageEmbed(message) {
    const prefix = await this.settings.getGuildSetting(message.guild, 'prefix');
    const embed = {
      type: 'rich',
      color: 0x0000ff,
      fields: [
        {
          name: `${prefix}${this.call} <ign>`,
          value: 'Search for Player Profile',
          inline: true,
        },
        {
          name: 'Parameters:',
          value: '`player in-game name` : In-game name of user whose profile you wish to fetch',
          inline: false,
        },
      ],
    };
    await this.messageManager.embed(message, embed, true, true);
  }
}

module.exports = PriceCheck;
