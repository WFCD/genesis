'use strict';

const Command = require('../Command.js');

const values = ['all', 'Arbiters of Hexis', 'Perrin Sequence', 'Cephalon Suda', 'Steel Meridian', 'New Loka', 'Red Veil'];

/**
 * Displays the currently active Invasions
 */
class Syndicates extends Command {
  /**
   * Constructs a callable command
   * @param {Genesis} bot  The bot object
   */
  constructor(bot) {
    super(bot, 'ondemand.syndicate', 'syndicate', 'Gets the starchat nodes for the desired syndicate, or all.');
    this.regex = new RegExp(`^${this.bot.escapedPrefix}syndicate(?:\\s+([\\w+\\s]+))?`, 'i');
    this.usages = [
      {
        description: 'Display syndicate nodes for a syndicate.',
        parameters: ['syndicate'],
      },
    ];
  }

  /**
   * Run the command
   * @param {Message} message Message with a command to handle, reply to,
   *                          or perform an action based on parameters.
   */
  run(message) {
    const syndicate = message.content.match(this.regex)[1];
    this.bot.settings.getChannelPlatform(message.channel)
      .then(platform => this.bot.worldStates[platform].getData())
      .then((ws) => {
        const syndicateMissions = ws.syndicateMissions;

        let syndicateInValues = false;
        let type = 'none';
        values.forEach((value) => {
          if (typeof syndicate !== 'undefined' && value.toLowerCase().indexOf(syndicate.toLowerCase()) !== -1) {
            syndicateInValues = true;
            type = value;
          }
        });

        const color = syndicateInValues ? 0x00ff00 : 0xff0000;
        const embed = {
          color,
          title: 'Worldstate - Syndicate Nodes',
          url: 'https://warframe.com',
          description: `Current Missions for Syndicate: ${type}`,
          thumbnail: {
            url: 'https://github.com/aliasfalse/genesis/raw/master/src/resources/syndicate.png',
          },
          fields: [],
          footer: {
            icon_url: 'https://avatars1.githubusercontent.com/u/24436369',
            text: 'Data evaluated by warframe-wordstate-parser, Warframe Community Developers',
          },
        };
        if (syndicateInValues) {
          syndicateMissions.forEach((syndicateMission) => {
            if (syndicateMission.syndicate === type || type === 'all') {
              embed.fields.push({ name: syndicateMission.syndicate, value: `${syndicateMission.nodes.join('\n')} \n\nExpires in ${syndicateMission.getETAString()}` });
            }
          });
        } else {
          embed.fields.push({ name: 'No such Syndicate', value: `Valid values: ${values.join(', ')}` });
        }

        return message.channel.sendEmbed(embed);
      }).then(() => {
        if (message.deletable) {
          return message.delete(2000);
        }
        return Promise.resolve();
      })
      .catch(this.logger.error);
  }
}

module.exports = Syndicates;
