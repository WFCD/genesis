'use strict';

const Command = require('../../models/Command.js');

/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class FrameProfile extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.tutorial', 'tutorial', 'Get a Warframe Tutorial Video', 'WARFRAME');
    this.regex = new RegExp(`^${this.call}s?\\s?(.+)?`, 'i');
    this.usages = [
      {
        description: 'Get a Warframe Tutorial Video',
        parameters: ['subject'],
      },
    ];
  }

  async run(message) {
    let query = message.strippedContent.match(this.regex)[1];

    if (query) {
      query = query.trim().toLowerCase();
      const results = await this.ws.search(this.ws.ENDPOINTS.WORLDSTATE.TUTORIALS, query);
      if (results.length > 0) {
        await Promise.all(results.map(tutorial => message.reply({ content: `Warframe Tutorial | ${tutorial.name}: ${tutorial.url}` })));
        return this.constructor.statuses.SUCCESS;
      }
    }
    const tutorials = await this.ws.g(this.ws.ENDPOINTS.WORLDSTATE.TUTORIALS);
    const embed = {
      title: 'Available Tutorials',
      fields: [{ name: '\u200B', value: tutorials.map(tutorial => tutorial.name).join('\n') }],
      footer: {
        icon_url: 'https://warframestat.us/wfcd_logo_color.png',
        text: 'Data evaluated by Warframe Community Developers',
      },
    };
    await message.reply({ embeds: [embed] });
    return this.constructor.statuses.FAILURE;
  }
}

module.exports = FrameProfile;
