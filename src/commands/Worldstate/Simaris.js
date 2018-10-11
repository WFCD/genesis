'use strict';

const Command = require('../../models/Command.js');
const SimarisEmbed = require('../../embeds/SimarisEmbed.js');
const SynthesisTargetEmbed = require('../../embeds/SynthesisTargetEmbed.js');
const { apiBase } = require('../../CommonFunctions');
const { createPageCollector } = require('../../CommonFunctions');
const request = require('request-promise');
const Logger = require('../../Logger.js');

/**
 * Displays the current simaris target
 */
class Simaris extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.worldstate.simaris', 'simaris', 'Display current Sanctuary status.');
    // Can only have 1 regex that a command can match on, so this is a combination of platform or target
    this.regex = new RegExp(`(^${this.call}(?:\\s+on\\s+([pcsxb14]{2,3}))?$)|(^${this.call}(?:\\s+target\\s+([\\sa-zA-Z0-9]+))?$)`, 'i');
    this.platformRegex = new RegExp(`^${this.call}(?:\\s+on\\s+([pcsxb14]{2,3}))?$`, 'i');
    this.targetRegex = new RegExp(`^${this.call}(?:\\s+target\\s+([\\sa-zA-Z0-9]+))?$`, 'i');
    this.logger = new Logger();
  }

  async run(message, ctx) {
    const platformParam = await this.getRegexParam(message, this.platformRegex)
    this.logger.debug(`got platform ${platformParam}`);

    const targetParam = await this.getRegexParam(message, this.targetRegex);
    this.logger.debug(`got target ${targetParam}`);
    
    if (targetParam !== undefined) {
      await this.handleTargetCommand(message, targetParam);
    } else {
      await this.handleSimarisCommmand(message, ctx, platformParam);
    }
    
    return this.messageManager.statuses.SUCCESS;
  }

  async handleSimarisCommmand(message, ctx, platformParam) {
    const platform = platformParam || ctx.platform;
    const ws = await this.bot.worldStates[platform.toLowerCase()].getData();
    const { simaris } = ws;
    await this.messageManager.embed(
      message,
      new SimarisEmbed(this.bot, simaris, platform), true, false,
    );
  }

  async handleTargetCommand(message, targetParam) {
    let query = targetParam;
    this.logger.debug(`query: "${JSON.stringify(query)}"`);

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
    if (results.length === 1) {
      this.messageManager.embed(message,
        new SynthesisTargetEmbed(this.bot, results, query), true, false);
    } else {
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
  }

  async getRegexParam(message, regex) {
    var param = undefined;
    const matches = message.strippedContent.match(regex);
    if (matches !== null)
      param = matches[1];
    return param;
  }
}

module.exports = Simaris;
