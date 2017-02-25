'use strict';

const Command = require('../../Command.js');
const profiles = require('../../resources/profiles.json');
/**
 * Displays the response time for the bot and checks Warframe's servers to see if they are up
 */
class FrameProfile extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot The bot object
   */
  constructor(bot) {
    super(bot, 'warframe.misc.profile', 'frame profile', 'Get a Warframe\'s profile video');
    this.regex = new RegExp('^frame(?:\\s?profile)?(.+)?', 'i');
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
    let frame = message.strippedContent.match(this.regex)[1];
    if (frame) {
      frame = frame.trim().toLowerCase();
      profiles.forEach((profile) => {
        if (new RegExp(profile.regex, 'ig').test(frame)) {
          this.messageManager.reply(message, `Warfame Profile | ${profile.name} : ${profile.url}`, true, false);
        }
      });
    } else {
      this.messageManager.embed(message, {
        title: 'Available Profiles',
        fields: [{ name: '_ _', value: profiles.map(profile => profile.name).join('\n') }],
        footer: {
          icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
          text: 'Data evaluated by Warframe Community Developers',
        },
      }, true, false);
    }
  }
}

module.exports = FrameProfile;
