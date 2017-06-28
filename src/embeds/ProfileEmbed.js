'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const founderEmoji = {
  grandmaster: '<:grandmaster:329484751876653076>',
  master: '<:master:329484751570468867>',
  hunter: '<:hunter:329484751972990977>',
  disciple: '<:disciple:329484752098951168>',
};

/**
 * Generates enemy embeds
 */
class ProfileEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Object} player - The enhancement to send info on
   */
  constructor(bot, player) {
    super();

    if (player && typeof player !== 'undefined') {
      this.author = {
        name: player.name,
        icon_url: 'https://i.imgur.com/IrGOTEf.png',
      };
      this.color = 0x993F37;
      const accolades = [];
      if (player.accolades.founder) {
        accolades.push(`:white_small_square: ${player.accolades.founder} Founder ` +
          `${founderEmoji[player.accolades.founder.toLowerCase().split(' ').join('')]}`);
      }
      if (player.accolades.guide) {
        accolades.push(`:white_small_square: ${player.accolades.guide} <:gotl:329511107536486400>`);
      }
      if (player.accolades.moderator) {
        accolades.push(' :white_small_square: Community Moderator');
      }
      if (player.accolades.partner) {
        accolades.push(' :white_small_square: Warframe Partner');
      }
      if (player.accolades.staff) {
        accolades.push(' :white_small_square: Digital Extremes');
      }
      this.fields = [
        {
          name: 'Accolades',
          value: accolades.length > 0 ? accolades.join('\n') : 'None',
          inline: false,
        },
        {
          name: 'Mastery',
          value: `${player.mastery.rank.number} - ${player.mastery.rank.name}`,
          inline: true,
        },
        {
          name: 'Current Mastery',
          value: player.mastery.xp,
          inline: true,
        },
        {
          name: 'Next Rank',
          value: `${player.mastery.xpUntilNextRank} until ${player.mastery.rank.next}`,
          inline: true,
        },
        {
          name: 'Clan',
          value: player.clan.type ? `Rank **${player.clan.rank}** ${player.clan.type} - ${player.clan.name}` : player.clan.rank,
          inline: true,
        },
        {
          name: 'Marked for Death',
          value: `**Stalker**: ${player.marked.stalker ? 'yes' : 'no'}\n` +
                  `**Grustrag Three**: ${player.marked.g3 ? 'yes' : 'no'}\n` +
                  `**Zanuka Harvester**: ${player.marked.zanuka ? 'yes' : 'no'}`,
          inline: false,
        },
      ];
    } else {
      this.fields = [{ name: '_ _', value: 'No Such Player' }];
    }
  }
}

module.exports = ProfileEmbed;
