'use strict';

const cluster = require('cluster');
// eslint-disable-next-line import/no-unresolved
const Nexus = require('warframe-nexus-query');
const Cache = require('json-fetch-cache');
const NexusFetcher = require('nexus-stats-api');
const Raven = require('raven');

const DataCache = require('./src/resources/DropCache.js');
const Genesis = require('./src/bot.js');
const ClusterManager = require('./src/ClusterManager.js');

/**
 * Raven client instance for logging errors and debugging events
 */
const client = Raven.config(process.env.RAVEN_URL, {
  autoBreadcrumbs: true,
});

/**
 * Logging functions class
 * @type {Object}
 */
const Logger = require('./src/Logger.js');

client.install();
client.on('error', (error) => {
  //  eslint-disable-next-line no-console
  console.error(`Could not report the following error to Sentry: ${error.message}`);
});

const logger = new Logger(client);
process.on('uncaughtException', (err) => {
  logger.error(err);
});
process.on('unhandledRejection', (err) => {
  logger.error(err);
});

const nexusOptions = {
  user_key: process.env.NEXUSSTATS_USER_KEY || undefined,
  user_secret: process.env.NEXUSSTATS_USER_SECRET || undefined,
  ignore_limiter: true,
};

const nexusFetcher = new NexusFetcher(nexusOptions.nexusKey
    && nexusOptions.nexusSecret ? nexusOptions : {});

const nexusQuerier = new Nexus(nexusFetcher);

const caches = {
  pc: new Cache('https://ws.warframestat.us/pc', 600000),
  xb1: new Cache('https://ws.warframestat.us/xb1', 600000),
  ps4: new Cache('https://ws.warframestat.us/ps4', 600000),
  dropCache: new DataCache(logger),
};

if (cluster.isMaster) {
  const localShards = parseInt(process.env.LOCAL_SHARDS, 10) || 1;
  const shardOffset = parseInt(process.env.SHARD_OFFSET, 10) || 0;

  const clusterManager = new ClusterManager(cluster, logger, localShards, shardOffset);
  clusterManager.start();
} else {
  const totalShards = parseInt(process.env.SHARDS, 10) || 1;
  const shard = new Genesis(process.env.TOKEN, logger, {
    shardId: parseInt(process.env.shard_id, 10),
    shardCount: totalShards,
    prefix: process.env.PREFIX,
    logger,
    owner: process.env.OWNER,
    nexusQuerier,
    caches,
    nexusFetcher,
  });
  shard.start();
}
