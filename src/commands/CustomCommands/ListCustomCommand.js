'use strict';

const Command = require('../../models/Command.js');
const { createGroupedArray } = require('../../CommonFunctions.js');

class ListCustomCommand extends Command {
  constructor(bot) {
    super(bot, 'settings.cc.list', 'list cc', 'List custom commands for this guild');
    this.requiresAuth = false;
    this.allowDM = false;
  }

  async run(message) {
    const ccs = [];
    const gcc = await this.settings.getCustomCommandsForGuild(message.guild);
    gcc.forEach((cc) => {
      if (cc.response.length > 1024) {
        ccs.push({ name: cc.call, value: decodeURIComponent(cc.response.substring(0, 1020)) });
        ccs.push({ name: '_ _', value: decodeURIComponent(cc.response.substring(1021)) });
      } else {
        ccs.push({ name: cc.call, value: decodeURIComponent(cc.response) });
      }
    });
    const metaGroups = createGroupedArray(ccs, 10);
    metaGroups.forEach((metaGroup) => {
      this.messageManager.embed(message, { color: 0x301934, fields: metaGroup }, true, false);
    });

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ListCustomCommand;
