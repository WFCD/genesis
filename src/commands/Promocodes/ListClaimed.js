'use strict';

const Command = require('../../models/Command.js');
const { createGroupedArray, createPageCollector } = require('../../CommonFunctions.js');

class ListClaimed extends Command {
  constructor(bot) {
    super(bot, 'promocode.code.claimed', 'glyphs list claimed', 'List claimed codes.', 'CODES');
    this.regex = new RegExp(`^${this.call}`, 'i');
    this.allowDM = true;
  }

  async run(message) {
    if (message.channel.type !== 'dm') {
      await message.reply({ content: 'be careful calling this command in a public server channel, as it exposes your codes and links to claim them.' });
    }
    const codes = await this.settings.getUserCodes(message.author);
    const groupCodes = createGroupedArray(codes, 27);
    const pages = [];
    groupCodes.forEach((codeGroup) => {
      const embed = {
        title: 'Claimed Codes',
        color: 0xd30000,
        fields: codeGroup.length === 0
          ? [{ name: '\u200B', value: 'No claimed codes' }]
          : codeGroup.map(code => ({
            name: `${code.pool_name} • ${(code.platform || 'pc').toUpperCase()}`,
            value: `\`${code.code}\`\n[Claim](https://warframe.com/promocode?code=${code.code})`,
          })),
      };
      pages.push(embed);
    });
    if (pages.length) {
      const msg = await message.reply({ embeds: [pages[0]] });
      if (pages.length > 1) {
        await createPageCollector(msg, pages, message.author);
      }
    }
    if (parseInt(await this.settings.getChannelSetting(message.channel, 'delete_after_respond'), 10) && message.deletable) {
      setTimeout(message.delete, 10000);
    }
    return codes.length > 0
      ? this.messageManager.statuses.SUCCESS
      : this.messageManager.statuses.FAILURE;
  }
}

module.exports = ListClaimed;
