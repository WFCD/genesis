'use strict';

const request = require('request-promise');

const carbonToken = process.env.DISCORD_CARBON_TOKEN;
const botsDiscordPwToken = process.env.DISCORD_BOTS_WEB_TOKEN;
const botsDiscordPwUser = process.env.DISCORD_BOTS_WEB_USER;
const updateInterval = process.env.TRACKERS_UPDATE_INTERVAL || 2600000;

/**
 * Describes a tracking service for updating remote sites
 * with server count for this bot
 */
class Tracker {
  /**
   * Constructs a simple tracking service with the given logger
   * @param {Logger} logger          Simple logger for logging information
   * @param {Client} client Discord Client for fetching statistucs from
   */
  constructor(logger, client, { shardId = 0, shardCount = 1 }) {
    this.logger = logger;
    this.client = client;
    this.shardId = shardId;
    this.shardCount = shardCount;
    if (carbonToken) {
      setInterval(() => this.updateCarbonitex(this.client.guilds.length), updateInterval);
    }
    if (botsDiscordPwToken && botsDiscordPwUser) {
      setInterval(() => this.updateDiscordBotsWeb(this.client.guilds.length), updateInterval);
    }
  }

  /**
   * Updates carbonitex.net if the corresponding token is provided
   * @param   {number}  guildsLen number of guilds that this bot is present on
   * @returns {boolean} Whether or not the update completed successfully
   */
  updateCarbonitex(guildsLen) {
    let completed = false;
    if (carbonToken) {
      this.logger.debug('Updating Carbonitex');
      this.logger.debug(`${this.client.user.username} is on ${guildsLen} servers`);
      const requestBody = {
        url: 'https://www.carbonitex.net/discord/data/botdata.php',
        body: {
          key: carbonToken,
          servercount: guildsLen,
        },
        json: true,
      };
      request(requestBody)
        .then((parsedBody) => {
          this.logger.debug(parsedBody);
          completed = true;
        })
        .catch(error => this.logger.error(error));
    }
    return completed;
  }

  /**
   * Updates bots.discord.pw if the corresponding token is provided
   * @param   {number}  guildsLen number of guilds that this bot is present on
   * @returns {boolean} Whether or not the update completed successfully
   */
  updateDiscordBotsWeb(guildsLen) {
    let completed = false;
    if (botsDiscordPwToken && botsDiscordPwUser) {
      this.logger.debug('Updating discord bots');
      this.logger.debug(`${this.client.username} is on ${guildsLen} servers`);
      const requestBody = {
        method: 'POST',
        url: `https://bots.discord.pw/api/bots/${botsDiscordPwUser}/stats`,
        headers: {
          Authorization: botsDiscordPwToken,
        },
        body: {
          shard_id: parseInt(this.shardId, 10),
          shard_count: parseInt(this.shardCount, 10),
          server_count: parseInt(guildsLen, 10),
        },
        json: true,
      };
      request(requestBody)
      .then((parsedBody) => {
        this.logger.debug(parsedBody);
        completed = true;
      })
      .catch(error => this.logger.error(error));
    }
    return completed;
  }

  /**
   * Update all trackers
   * @param {number} guildsLen Number of guilds that this bot is present on
   */
  updateAll(guildsLen) {
    this.updateCarbonitex(guildsLen);
    this.updateDiscordBotsWeb(guildsLen);
  }
}

module.exports = Tracker;
