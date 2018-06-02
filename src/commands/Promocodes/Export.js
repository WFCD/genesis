'use strict';

const Command = require('../../models/Command.js');
const { resolvePool } = require('../../CommonFunctions');

class ExportPromocodes extends Command {
  constructor(bot) {
    super(bot, 'promocode.export', 'glyphs export', 'Export promocodes the user has access to to a csv file.');
    this.requiresAuth = true;
    this.allowDM = true;
  }

  async run(message) {
    let pools = await resolvePool(message, this.settings);
    if (typeof pools === 'string') {
      pools = [pools];
    }
    if (pools.length === 0) {
      this.messageManager.reply(message, '**[Denied]** You manage no pools.');
      return this.messageManager.statuses.FAILURE;
    }
    const codes = await this.settings.getCodesInPools(pools);
    const fileContents = codes.map(code => `"${code.id}","${code.platform}","${code.addedBy}","${code.addedOn}",${code.grantedTo},${code.grantedBy},${code.grantedOn},${code.code}`);
    if (message.channel.type !== 'dm') {
      this.messageManager.reply(message, 'Check your direct messages for the file.', true, true);
    }
    this.messageManager.sendFileToAuthor(message, Buffer.from(fileContents.join('\n'), 'ascii'), 'codes.csv', true);

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ExportPromocodes;
