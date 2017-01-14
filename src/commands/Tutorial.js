'use strict';

const Command = require('../Command.js');
const tutorials = require('../resources/tutorials.json');
/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class FrameProfile extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'misc.warframe.tutorial', 'tutorial', 'Get a Warframe Tutorial Video');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}tutorial(.+)?`, 'i');
    this.usages = [
      {
        description: 'Get a Warframe Tutorial Video',
        parameters: ['subject'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    let query = message.content.match(this.regex)[1];
    let promise;
    if (query) {
      query = query.trim().toLowerCase();

      tutorials.forEach((tutorial) => {
        if (new RegExp(tutorial.regex, 'ig').test(query)) {
          promise = message.reply(`Warfame Tutorial | ${tutorial.name} : ${tutorial.url}`);
        }
      });
    } else {
      promise = message.channel.sendEmbed({
        title: 'Available Tutorials',
        fields: [{ name: '_ _', value: tutorials.map(tutorial => tutorial.name).join('\n') }],
        footer: {
          icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
          text: 'Data evaluated by Warframe Community Developers',
        },
      });
    }
    if (promise) {
      promise.then(() => {
        if (message.deletable) {
          message.delete(10000);
        }
      })
      .catch(this.logger.error);
    }
  }
}

module.exports = FrameProfile;
