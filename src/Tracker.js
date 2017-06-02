'use strict';

const request = require('request-promise');

const carbonToken = process.env.DISCORD_CARBON_TOKEN;
const botsDiscordPwToken = process.env.DISCORD_BOTS_WEB_TOKEN;
const botsDiscordPwUser = process.env.DISCORD_BOTS_WEB_USER;
const updateInterval = process.env.TRACKERS_UPDATE_INTERVAL || 2600000;
const discordListToken = process.env.DISCORD_LIST_TOKEN;
const cachetToken = process.env.CACHET_TOKEN;
const cachetHost = process.env.CACHET_HOST;
const metricId = process.env.CACHET_BOT_METRIC_ID;
const heartBeatTime = process.env.CACHET_HEARTBEAT || 600000;

/**
 * Describes a tracking service for updating remote sites
 * with server count for this bot
 */
class Tracker {
  /**
   * Constructs a simple tracking service with the given logger
   * @param {Logger} logger          Simple logger for logging information
   * @param {Client} client Discord Client for fetching statistucs from
   * @param {ShardClientUtil} shardUtil Discord shard client util
   * used to fetch shard count of all shards
   */
  constructor(logger, client, shardUtil, { shardId = 0, shardCount = 1 }) {
    this.logger = logger;
    this.client = client;
    this.shardUtil = shardUtil;
    this.shardId = shardId;
    this.shardCount = shardCount;


    if (carbonToken && this.shardId === 0) {
      setInterval(() => this.updateCarbonitex(this.shardUtil), updateInterval);
    }
    if (botsDiscordPwToken && botsDiscordPwUser) {
      setInterval(() => this.updateDiscordBotsWeb(this.client.guilds.size), updateInterval);
    }
    if (discordListToken) {
      setInterval(() => this.updateDiscordList(this.client.guilds.size), updateInterval);
    }
    if (cachetToken && cachetHost && metricId) {
      setInterval(() => this.postHeartBeat(), heartBeatTime);
    }
  }

  /**
   * Updates carbonitex.net if the corresponding token is provided
   * @param {ShardClientUtil} shardUtil Discord shard client util used
   * to fetch shard count of all shards
   */
  updateCarbonitex(shardUtil) {
    if (carbonToken) {
      shardUtil.fetchClientValues('guilds.size')
        .then(results => results.reduce((prev, val) => prev + val, 0))
        .then((guildsLen) => {
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
            })
            .catch(this.logger.error);
        })
        .catch(this.logger.error);
    }
  }

  /**
   * Updates discordlist.net if the corresponding token is provided
   * @param   {number}  guildsLen number of guilds that this bot is present on
   */
  updateDiscordList(guildsLen) {
    if (discordListToken) {
      this.logger.debug('Updating DiscordList');
      this.logger.debug(`${this.client.user.username} is on ${guildsLen} servers`);

      const requestBody = {
        url: 'https://bots.discordlist.net/api',
        body: {
          token: discordListToken,
          servers: guildsLen,
        },
        json: true,
      };
      request(requestBody)
        .then((parsedBody) => {
          this.logger.debug(parsedBody);
        })
        .catch(this.logger.error);
    }
  }

  /**
   * Updates bots.discord.pw if the corresponding token is provided
   * @param   {number}  guildsLen number of guilds that this bot is present on
   */
  updateDiscordBotsWeb(guildsLen) {
    if (botsDiscordPwToken && botsDiscordPwUser) {
      this.logger.debug('Updating discord bots');
      this.logger.debug(`${this.client.username} is on ${guildsLen} servers`);
      const requestBody = {
        method: 'POST',
        url: `https://bots.discord.pw/api/bots/${botsDiscordPwUser}/stats`,
        headers: {
          Authorization: botsDiscordPwToken,
          'Content-Type': 'application/json',
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
      })
      .catch(this.logger.error);
    }
  }

  /**
   * Update all trackers
   * @param {number} guildsLen Number of guilds that this bot is present on
   */
  updateAll(guildsLen) {
    this.updateCarbonitex(guildsLen);
    this.updateDiscordBotsWeb(guildsLen);
    this.updateDiscordList(guildsLen);
  }

  /**
   * Post the cachet heartbeat for the shardCount
   */
  postHeartBeat() {
    const requestBody = {
      method: 'POST',
      url: `${cachetHost}/api/v1/metrics/${metricId}/points`,
      headers: {
        'Content-Type': 'application/json',
        'X-Cachet-Token': cachetToken,
      },
      body: {
        value: 1,
      },
      json: true,
    };
    request(requestBody)
    .then((parsedBody) => {
      this.logger.debug(parsedBody);
    })
    .catch(this.logger.error);
  }
}

module.exports = Tracker;
