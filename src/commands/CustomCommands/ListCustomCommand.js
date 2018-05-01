'use strict';

const Command = require('../../models/Command.js');
const { createGroupedArray } = require('../../CommonFunctions.js');
const rpad = require('right-pad');

class ListCustomCommand extends Command {
  constructor(bot) {
    super(bot, 'settings.cc.list', 'list cc', 'List custom commands for this guild');
    this.requiresAuth = false;
    this.allowDM = false;
  }

  async run(message) {
    const ccs = (await this.settings.getCustomCommandsForGuild(message.guild))
      .map((cc) => {
        return { call: cc.call, response: cc.response };
      });
      
    const longest = ccs.map(cc => cc.call)
      .reduce((a, b) => (a.length > b.length ? a : b)).length;
    const subGroupCCs = createGroupedArray(ccs.map(cc => `\`${rpad(cc.call, longest, ' ')} ${cc.response}\``), 5);
    const metaGroups = createGroupedArray(subGroupCCs, 4);
    metaGroups.forEach((metaGroup) => {
      this.messageManager.embed(message, {
        fields: metaGroup.map(ccGroup => ({
          name: '_ _',
          value: ccGroup.join('\n'),
        })),
      }, true, false);
    });
    
    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = ListCustomCommand;
