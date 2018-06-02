'use strict';

const Command = require('../../models/Command.js');

class ListClaimed extends Command {
  constructor(bot) {
    super(bot, 'promocode.code.claimed', 'glyphs claimed', 'List claimed codes.');
    this.regex = new RegExp(`^${this.call}`, 'i');
    this.allowDM = true;
  }

  async run(message) {
    const codes = await this.settings.getUserCodes(message.author);
    const embed = {
      title: 'Claimed Codes',
      color: 0xd30000,
      fields: codes.length === 0 ? [{ name: '_ _', value: 'No claimed codes' }] :
        codes.map(code => ({
          name: `${code.pool_name} • ${code.platform.toUpperCase()}`,
          value: `\`\`\`\n${code.code}\`\`\``,
        })),
    };
    await this.messageManager.reply(message, 'Check your direct messages for results');
    await this.messageManager.sendDirectEmbedToAuthor(message, embed, false);
    return codes.length > 0 ?
      this.messageManager.statuses.SUCCESS :
      this.messageManager.statuses.FAILURE;
  }
}

module.exports = ListClaimed;
