'use strict';

const Command = require('../../models/Command.js');
const rpad = require('right-pad');
const { createGroupedArray } = require('../../CommonFunctions.js');

class ListPools extends Command {
  constructor(bot) {
    super(bot, 'promocode.pools.managed', 'glyphs managed', 'List claimed codes.');
    this.regex = new RegExp(`^${this.call}`, 'i');
    this.allowDM = true;
  }

  async run(message) {
    const pools = await this.settings.getPoolsUserManages(message.author);
    const longestName = pools.length ? pools.map(pool => pool.name)
      .reduce((a, b) => (a.length > b.length ? a : b)) : '';
    const longestId = pools.length ? pools.map(pool => pool.pool_id)
      .reduce((a, b) => (a.length > b.length ? a : b)) : '';
    pools.unshift({ pool_id: 'Pool Id', name: 'Pool Name', len: '# of Codes' });
    this.logger.debug(`name: ${longestName} | id: ${longestId}`);
    const groupPools = createGroupedArray(pools, 50);
    const poolOfPools = createGroupedArray(groupPools, 4);
    poolOfPools.forEach(async (poolGroup) => {
      const embed = {
        title: 'Managed Pools',
        color: 0xd30000,
        fields: poolGroup.map(group => ({
          name: '_ _',
          value: group.map(pool => `\`${rpad(pool.pool_id, longestName.length, ' ')} ` +
          `| ${rpad(pool.name, longestId.length, ' ')} | ${pool.len}\``).join('\n'),
        })),
      };
      await this.messageManager.sendDirectEmbedToAuthor(message, embed, false);
    });
    await this.messageManager.reply(message, 'Check your direct messages for results.');
    return pools.length > 0 ?
      this.messageManager.statuses.SUCCESS :
      this.messageManager.statuses.FAILURE;
  }
}

module.exports = ListPools;
