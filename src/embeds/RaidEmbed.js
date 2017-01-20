'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Calculate a user's stats from fetched json
 * @param  {Object} json JSON object describing all of a user's raid statistics
 * @returns {Ojbect}      User's statistics
 */
function calculateStats(json) {
  const stats = {
    lor: { successes: 0, completed: 0 },
    lornm: { successes: 0, completed: 0 },
    jv: { successes: 0, completed: 0 },
  };
  json.forEach((raid) => {
    if (raid.objective === 'VICTORY') {
      stats[`${raid.type}`].successes += 1;
    }
    stats[`${raid.type}`].completed += 1;
  });
  return stats;
}

/**
 * Generates simaris embeds
 */
class RaidStatEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Simaris} userStats - User raid stat json
   * @param {Message} message - Discord message object to pull information for avatar and author for
   * @param {string} query - Query for this embed
   */
  constructor(bot, userStats, message, query) {
    super();
    const avatar = message.author.avatarURL ? message.author.avatarURL : '';
    this.author = { name: query, icon_url: avatar };
    this.description = `Raid statistics for ${query}`;
    this.color = 0xaf5b4b;
    this.thumbnail = {
      url: 'https://raw.githubusercontent.com/aliasfalse/genesis/master/src/resources/NightmareRaidSekhara.png',
    };
    const stats = calculateStats(userStats);
    this.fields = [
      { name: 'Law of Retribution', value: `${stats.lor.successes}/${stats.lor.completed} Succeeded` },
      { name: 'Law of Retribution: Nightmare', value: `${stats.lornm.successes}/${stats.lornm.completed} Succeeded` },
      { name: 'Jordas Verdict', value: `${stats.jv.successes}/${stats.jv.completed} Succeeded` },
    ];

    this.footer.text = 'Data evaluated by Cephalon Genesis, Warframe Community Developers';
  }
}

module.exports = RaidStatEmbed;
