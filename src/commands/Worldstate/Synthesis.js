'use strict';

const request = require('request-promise');

const Command = require('../../models/Command.js');
const SynthesisEmbed = require('../../embeds/SynthesisEmbed.js');
const Logger = require('../../Logger.js');

const { createPageCollector } = require('../../CommonFunctions');

const { apiBase } = require('../../CommonFunctions');

/**
 * Displays the currently active alerts
 */
class Synthesis extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.synth', 'synth', 'Get information about synthesis targets');
    this.regex = new RegExp('^synth(.+)?', 'i');
    this.usages = [
      {
        description: 'Get information about synthesis targets',
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
      this.messageManager.embed(message, new SynthesisEmbed(this.bot, results, query), true, false);
    }
    else {
      // If there is more than one result, show a result list and the pages
      const pages = [];
      pages.push(new SynthesisEmbed(this.bot, results, query));
      results.forEach((result) => {
        pages.push(new SynthesisEmbed(this.bot, [result], query));
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

module.exports = Synthesis;
