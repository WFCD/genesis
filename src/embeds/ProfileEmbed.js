'use strict';

const BaseEmbed = require('./BaseEmbed.js');

const founderEmoji = {
  grandmaster: '<:grandmaster:329484751876653076>',
  master: '<:master:329484751570468867>',
  hunter: '<:hunter:329484751972990977>',
  disciple: '<:disciple:329484752098951168>',
};

const mrSigil = [
  'https://vignette3.wikia.nocookie.net/warframe/images/a/ae/MasteryAffinity64.png/revision/latest?cb=20170501023543',
  'https://vignette2.wikia.nocookie.net/warframe/images/4/4e/Initiate.jpg/revision/latest?cb=20131207082819',
  'https://vignette3.wikia.nocookie.net/warframe/images/a/a4/Silver-initiate.jpg/revision/latest?cb=20131207083232',
  'https://vignette2.wikia.nocookie.net/warframe/images/8/8f/Gold-initiate.jpg/revision/latest?cb=20131207083401',
  'https://vignette2.wikia.nocookie.net/warframe/images/9/91/Novice.jpg/revision/latest?cb=20131207083549',
  'https://vignette2.wikia.nocookie.net/warframe/images/9/99/Silver-novice.jpg/revision/latest?cb=20131207085318',
  'https://vignette1.wikia.nocookie.net/warframe/images/6/69/Gold-novice.jpg/revision/latest?cb=20131207085328',
  'https://vignette2.wikia.nocookie.net/warframe/images/9/92/Disciple.jpg/revision/latest?cb=20131207085340',
  'https://vignette3.wikia.nocookie.net/warframe/images/f/f8/Silver-disciple.jpg/revision/latest?cb=20131207085348',
  'https://vignette2.wikia.nocookie.net/warframe/images/8/84/Gold-disciple.jpg/revision/latest?cb=20131207085356',
  'https://vignette4.wikia.nocookie.net/warframe/images/4/4b/Seeker.jpg/revision/latest?cb=20131207085405',
  'https://vignette3.wikia.nocookie.net/warframe/images/0/0e/Silver-seeker.jpg/revision/latest?cb=20131207085412',
  'https://vignette2.wikia.nocookie.net/warframe/images/b/b9/Gold-seeker.jpg/revision/latest?cb=20131207085419',
  'https://vignette1.wikia.nocookie.net/warframe/images/2/2a/Hunter.jpg/revision/latest?cb=20131207085428',
  'https://vignette2.wikia.nocookie.net/warframe/images/1/19/Silver-hunter.jpg/revision/latest?cb=20131207085434',
  'https://vignette1.wikia.nocookie.net/warframe/images/7/75/Gold-hunter.jpg/revision/latest?cb=20131207085443',
  'https://vignette4.wikia.nocookie.net/warframe/images/0/0b/Eagle.jpg/revision/latest?cb=20131207085451',
  'https://vignette1.wikia.nocookie.net/warframe/images/c/c3/Silver-eagle.jpg/revision/latest?cb=20131207085458',
  'https://vignette3.wikia.nocookie.net/warframe/images/a/af/Gold-eagle.jpg/revision/latest?cb=20131207085504',
  'https://vignette3.wikia.nocookie.net/warframe/images/0/05/Tiger.jpg/revision/latest?cb=20131211200425',
  'https://vignette4.wikia.nocookie.net/warframe/images/d/d2/Silver-tiger.jpg/revision/latest?cb=20131211200435',
  'https://vignette2.wikia.nocookie.net/warframe/images/7/7e/Gold-tiger.jpg/revision/latest?cb=20131211200442',
  'https://vignette3.wikia.nocookie.net/warframe/images/b/bb/Dragon.jpg/revision/latest?cb=20131211200549',
  'https://vignette1.wikia.nocookie.net/warframe/images/3/3c/Silver-dragon.jpg/revision/latest?cb=20131211200600',
  'https://vignette2.wikia.nocookie.net/warframe/images/8/83/Gold-dragon.jpg/revision/latest?cb=20131211200607',
  'https://vignette3.wikia.nocookie.net/warframe/images/7/70/Sage.jpg/revision/latest?cb=20131211200700',
  'https://vignette4.wikia.nocookie.net/warframe/images/b/b0/Silver-sage.jpg/revision/latest?cb=20131211200711',
  'https://vignette3.wikia.nocookie.net/warframe/images/2/29/Gold-sage.jpg/revision/latest?cb=20131211200719',
  'https://vignette4.wikia.nocookie.net/warframe/images/7/7d/Master.jpg/revision/latest?cb=20131211200819',
  'https://vignette4.wikia.nocookie.net/warframe/images/f/f8/Middle-master.jpg/revision/latest?cb=20131211200826',
  'https://vignette3.wikia.nocookie.net/warframe/images/4/4d/Grand-master.jpg/revision/latest?cb=20131211200834',
];

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

    if (player && typeof player !== 'undefined' && player.name) {
      this.author = {
        name: player.name,
      };
      this.thumbnail = { url: mrSigil[player.mastery.rank.number] };
      this.color = 0x4B458D;
      const accolades = [];
      if (player.accolades.founder) {
        accolades.push(`${founderEmoji[player.accolades.founder.toLowerCase().split(' ').join('')]} ${player.accolades.founder} Founder`);
      }
      if (player.accolades.guide) {
        accolades.push(`<:gotl:329511107536486400> ${player.accolades.guide}`);
      }
      if (player.accolades.moderator) {
        accolades.push('<:commod:329774757576704001> Community Moderator');
      }
      if (player.accolades.partner) {
        accolades.push('<:partner:335483679285575700> Warframe Partner');
      }
      if (player.accolades.staff) {
        accolades.push('<:de:330057826133213194> Digital Extremes');
      }
      this.fields = [];

      if (accolades.length > 0) {
        this.fields.push({
          name: 'Accolades',
          value: accolades.length > 0 ? accolades.join('\n') : 'None',
          inline: false,
        });
      }

      const markedTokens = [];
      if (player.marked.stalker) {
        markedTokens.push('<:stalker:330021480169603076>');
      }
      if (player.marked.g3) {
        markedTokens.push('<:g3:330021480442101771>');
      }
      if (player.marked.zanuka) {
        markedTokens.push('<:zanuka:330021480912125953');
      }

      this.fields.push(
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
          value: `${player.mastery.xpUntilNextRank} until **${player.mastery.rank.next}**`,
          inline: true,
        },
        {
          name: 'Clan',
          value: player.clan.type ? `${player.clan.name}\nRank **${player.clan.rank}** ${player.clan.type}` : player.clan.name,
          inline: true,
        },
        {
          name: 'Marked for Death',
          value: markedTokens.length ? markedTokens.join('') : 'Unmarked',
          inline: true,
        },
      );
      this.footer.text = `Last Updated ${new Date(player.updatedAt).toLocaleString()} UTC | Data provided by Nexus-Stats.com`;
    } else {
      this.fields = [{ name: '\u200B', value: 'No Such Player' }];
    }
  }
}

module.exports = ProfileEmbed;
