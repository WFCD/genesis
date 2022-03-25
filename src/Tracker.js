import fetch from 'node-fetch';

import AutoPoster from 'topgg-autoposter';

import logger from './utilities/Logger.js';

const Job = require('cron').CronJob;

const config = {
  carbon: {
    token: process.env.DISCORD_CARBON_TOKEN,
  },
  botsGG: {
    token: process.env.BOTS_GG_TOKEN,
    id: process.env.BOTS_GG_USER,
  },
  topgg: { token: process.env.TOP_GG_TOKEN },
  cachet: {
    metricId: process.env.CACHET_BOT_METRIC_ID,
    host: process.env.CACHET_HOST,
    token: process.env.CACHET_TOKEN,
    heartbeat: process.env.CACHET_HEARTBEAT || 600000,
  },
};

/**
 * Post the cachet heartbeat for the shardCount
 */
async function postHeartBeat() {
  const parsedBody = await fetch(config.cachet.url, {
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
  logger.debug(parsedBody);
}

const crons = {
  HOURLY: '0 0 * * * *',
  MINUTELY: '0 * * * * *',
  TEN_MINUTELY: '0 */10 * * * *',
};

/**
 * Describes a tracking service for updating remote sites
 * with server count for this bot
 */
export default class Tracker {
  #currentCount;
  #jobs;
  #bot;
  #topggAutoposter;

  /**
   * Constructs a simple server-tracking service
   * @param {Bot} bot parent reference
   * used to fetch shard count of all shards
   */
  constructor(bot) {
    this.#bot = bot;
    config.cachet.url = `${config.cachet.host}/api/v1/metrics/${config.cachet.metricId}/points`;

    this.#jobs = {};

    const isConfigured = {
      carbonitex: typeof config.carbon.token !== 'undefined',
      botsGG: config.botsGG.token && config.botsGG.id,
    };

    if (config.carbon.token) {
      this.#jobs.carbonitex = new Job(
        crons.HOURLY, this.updateCarbonitex.bind(this), undefined, true,
      );
    }
    if (config.botsGG.token && config.botsGG.id) {
      this.#jobs.botsGG = new Job(crons.HOURLY, this.updateBotsGG.bind(this), undefined, true);
    }
    if (config.topgg.token) {
      this.#topggAutoposter = new AutoPoster(config.topgg.token, this.bot.client);
    }

    // warframestat.us metrics
    if (config.cachet.host && config.cachet.token && config.cachet.metricId) {
      this.#jobs.cachet = new Job(crons.MINUTELY, postHeartBeat, undefined, true);
    }

    if (isConfigured.carbonitex || isConfigured.botsGG) {
      this.#jobs.count = new Job(crons.TEN_MINUTELY, () => {
        this.#currentCount = this.bots.client.guilds.cache.size();
      }, undefined, true);
    }
  }

  /**
   * Updates carbonitex.net if the corresponding token is provided
   */
  async updateCarbonitex() {
    if (config.carbon.token) {
      logger.debug(`Carbonitex | ${this.client.user.username} is on ${this.#currentCount} servers`, 'TRACK');

      try {
        const parsedBody = await fetch('https://www.carbonitex.net/discord/data/botdata.php', {
          method: 'POST',
          body: JSON.stringify({
            key: config.carbon.token,
            servercount: this.#currentCount,
          }),
          headers: { 'Content-Type': 'application/json' },
        })
          .then(data => data.json());
        logger.debug(parsedBody);
      } catch (err) {
        logger.error(`Error updating carbonitex. Token: ${config.carbon.token} | Error Code: ${err.statusCode} | Guilds: ${this.#currentCount}`);
      }
    }
  }

  /**
   * Updates discord.bots.gg if the corresponding token is provided
   */
  async updateBotsGG() {
    if (config.botsDiscordPw.token && config.botsDiscordPw.id) {
      logger.debug('Updating discord bots');
      logger.debug(`${this.client.username} is on ${this.#currentCount} servers`);
      try {
        const parsedBody = await fetch(`https://discord.bots.gg/api/v1/bots/${config.botsGG.id}/stats`, {
          method: 'POST',
          body: JSON.stringify({
            guildCount: parseInt(this.#currentCount, 10),
          }),
          headers: {
            'Content-Type': 'application/json',
            Authorization: config.botsGG.token,
          },
        })
          .then(data => data.json());
        logger.debug(parsedBody);
      } catch (err) {
        logger.error(`Error updating bots.discord.gg. User: ${config.botsGG.id} | Error Code: ${err.statusCode}`);
      }
    }
  }

  /**
   * Update all trackers
   */
  #updateAll () {
    this.updateCarbonitex();
    this.updateBotsGG();
  }
}
