'use strict';

const Command = require('../Command.js');
const profiles = require('../resources/profiles.json');
/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class FrameProfile extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'misc.warframe.profile', 'frame profile', 'Get a Warframe\'s profile video');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}frame(?:\\s?profile)?(.+)?`, 'i');
    this.usages = [
      {
        description: 'Get a Warframe\'s profile video',
        parameters: ['warframe'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    let frame = message.content.match(this.regex)[1];
    let promise;
    if (frame) {
      frame = frame.trim().toLowerCase();

      profiles.forEach((profile) => {
        if (new RegExp(profile.regex, 'ig').test(frame)) {
          promise = message.reply(`Warfame Profile | ${profile.name} : ${profile.url}`);
        }
      });
    } else {
      promise = message.channel.sendEmbed({
        title: 'Available Profiles',
        fields: [{ name: '_ _', value: profiles.map(profile => profile.name).join('\n') }],
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
