'use strict';

const request = require('request-promise');

const Command = require('../../models/Command.js');
const SynthesisTargetEmbed = require('../../embeds/SynthesisTargetEmbed.js');
const Logger = require('../../Logger.js');

const { createPageCollector } = require('../../CommonFunctions');

const { apiBase } = require('../../CommonFunctions');

/**
 * Displays allows the user
 */
class SimarisTarget extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.synth', 'simaris', 'Search for synthesis targets based on name');
    this.regex = new RegExp(`^${this.call}(?:\\s+([a-zA-Z]+))?$`, 'i');
    this.usages = [
      {
        description: 'Search for synthesis targets based on name',
        parameters: ['target-name'],
      },
    ];
    this.logger = new Logger();
  }

  async run(message) {

    let query = message.strippedContent.match(this.regex)[1];
    this.logger.debug(`query: ${JSON.stringify(query)}`);

    const options = {
      uri: `${apiBase}/synthtargets`,
      json: true,
      rejectUnauthorized: false,
    };
    if (query) {
      query = query.trim().toLowerCase();
    }

    // Search the synth targets for the user's query
    options.uri = `${apiBase}/synthtargets/search/${query}`;
    const results = await request(options);

    // If there is a single result, show it
    if (results.length == 1) {
      this.messageManager.embed(message, new SynthesisTargetEmbed(this.bot, results, query), true, false);
    }
    else {
      // If there is more than one result, show a result list and the pages
      const pages = [];
      pages.push(new SynthesisTargetEmbed(this.bot, results, query));
      results.forEach((result) => {
        pages.push(new SynthesisTargetEmbed(this.bot, [result], query));
      });
      if (pages.length) {
        const msg = await this.messageManager.embed(message, pages[0], false, false);
        await createPageCollector(msg, pages, message.author);
      }
      if (parseInt(await this.settings.getChannelSetting(message.channel, 'delete_after_respond'), 10) && message.deletable) {
        message.delete(10000);
      }  
    }

    return this.messageManager.statuses.SUCCESS;
  }
}

module.exports = SimarisTarget;
