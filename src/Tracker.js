'use strict';

const fetch = require('node-fetch');

const config = {
  updateInterval: process.env.TRACKERS_UPDATE_INTERVAL || 3660000,
  carbon: {
    token: process.env.DISCORD_CARBON_TOKEN,
  },
  botsDiscordPw: {
    token: process.env.DISCORD_BOTS_WEB_TOKEN,
    id: process.env.DISCORD_BOTS_WEB_USER,
  },
  cachet: {
    metricId: process.env.CACHET_BOT_METRIC_ID,
    host: process.env.CACHET_HOST,
    token: process.env.CACHET_TOKEN,
    heartbeat: process.env.CACHET_HEARTBEAT || 600000,
  },
  botsDiscordOrg: {
    token: process.env.DISCORD_BOTS_ORG_TOKEN,
    id: process.env.DISCORD_BOTS_ORG_ID,
  },
};

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


    if (config.carbon.token && this.shardId === 0) {
      setInterval(() => this.updateCarbonitex(this.shardUtil), config.updateInterval);
    }
    if (config.botsDiscordPw.token && config.botsDiscordPw.id) {
      setInterval(() => this.updateDiscordBotsWeb(this.client.guilds.size), config.updateInterval);
    }
    if (config.botsDiscordOrg.token && config.botsDiscordOrg.id) {
      setInterval(() => this.updateDiscordBotsOrg(this.client.guilds.size), config.updateInterval);
    }
    if (config.cachet.host && config.cachet.token && config.cachet.metricId) {
      setInterval(() => this.postHeartBeat(), config.cachet.heartbeat);
    }
  }

  /**
   * Updates carbonitex.net if the corresponding token is provided
   * @param {ShardClientUtil} shardUtil Discord shard client util used
   * to fetch shard count of all shards
   */
  async updateCarbonitex(shardUtil) {
    if (config.carbon.token) {
      const results = await shardUtil.fetchClientValues('guilds.size');
      const guildsLen = results.reduce((prev, val) => prev + val, 0);
      this.logger.debug('Updating Carbonitex');
      this.logger.debug(`${this.client.user.username} is on ${guildsLen} servers`);

      try {
        const parsedBody = await fetch('https://www.carbonitex.net/discord/data/botdata.php', {
          method: 'POST',
          body: JSON.stringify({
            key: config.carbon.token,
            servercount: guildsLen,
            shardid: parseInt(this.shardId, 10),
            shardcount: parseInt(this.shardCount, 10),
          }),
          headers: { 'Content-Type': 'application/json' },
        })
          .then(data => data.json());
        this.logger.debug(parsedBody);
      } catch (err) {
        this.logger.error(`Error updating carbonitex. Token: ${config.carbon.token} | Error Code: ${err.statusCode} | Guilds: ${guildsLen}`);
      }
    }
  }

  /**
   * Updates bots.discord.pw if the corresponding token is provided
   * @param   {number}  guildsLen number of guilds that this bot is present on
   */
  async updateDiscordBotsWeb(guildsLen) {
    if (config.botsDiscordPw.token && config.botsDiscordPw.id) {
      this.logger.debug('Updating discord bots');
      this.logger.debug(`${this.client.username} is on ${guildsLen} servers`);
      try {
        const parsedBody = await fetch(`https://discord.bots.gg/api/v1/bots/${config.botsDiscordPw.id}/stats`, {
          method: 'POST',
          body: JSON.stringify({
            shard_id: parseInt(this.shardId, 10),
            shard_count: parseInt(this.shardCount, 10),
            server_count: parseInt(guildsLen, 10),
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: config.botsDiscordPw.token,
          },
        })
          .then(data => data.json());
        this.logger.debug(parsedBody);
      } catch (err) {
        this.logger.error(`Error updating bots.discord.gg. User: ${config.botsDiscordPw.id} | Error Code: ${err.statusCode}`);
      }
    }
  }

  /**
   * Updates discordbots.org if the corresponding token is provided
   * @param   {number}  guildsLen number of guilds that this bot is present on
   */
  async updateDiscordBotsOrg(guildsLen) {
    if (config.botsDiscordOrg.token && config.botsDiscordOrg.id) {
      this.logger.debug('Updating discordbots.org');
      this.logger.debug(`${this.client.username} is on ${guildsLen} servers`);
      try {
        const parsedBody = await fetch(`https://discordbots.org/api/bots/${config.botsDiscordOrg.id}/stats`, {
          method: 'POST',
          body: JSON.stringify({
            shard_id: parseInt(this.shardId, 10),
            shard_count: parseInt(this.shardCount, 10),
            server_count: parseInt(guildsLen, 10),
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: config.botsDiscordOrg.token,
          },
        })
          .then(data => data.json());
        this.logger.debug(parsedBody);
      } catch (err) {
        this.logger.error(`Error updating discordbots.org. User: ${config.botsDiscordOrg.id} | Error Code: ${err.statusCode}`);
      }
    }
  }

  /**
   * Update all trackers
   * @param {number} guildsLen Number of guilds that this bot is present on
   */
  updateAll(guildsLen) {
    this.updateCarbonitex(guildsLen);
    this.updateDiscordBotsWeb(guildsLen);
  }

  /**
   * Post the cachet heartbeat for the shardCount
   */
  async postHeartBeat() {
    const parsedBody = await fetch(`${config.cachet.host}/api/v1/metrics/${config.cachet.metricId}/points`, {
      method: 'POST',
      body: JSON.stringify({
        value: 1,
      }),
      headers: {
        'Content-Type': 'application/json',
        'X-Cachet-Token': config.cachet.token,
      },
    })
      .then(data => data.json());
    this.logger.debug(parsedBody);
  }
}

module.exports = Tracker;
