'use strict';

const cluster = require('cluster');

/**
 * Raven client for logging errors and debugging events
 * @type {Raven}
 */
const Raven = require('raven');

/**
 * Bot class for interacting with discord and handling commands
 * @type {Genesis}
 */
const Genesis = require('./src/bot.js');

const Cache = require('json-fetch-cache');

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

/**
 * Class that manages the cluster's workers
 * @type {Function}
 */
const ClusterManager = require('./src/ClusterManager.js');

client.install();

client.on('error', (error) => {
  //  eslint-disable-next-line no-console
  console.error(`Could not report the following error to Sentry: ${error.message}`);
});

const logger = new Logger(client);

const Nexus = require('warframe-nexus-query');

const nexusQuerier = new Nexus();

const caches = {
  pc: new Cache('https://ws.warframestat.us/pc', 600000),
  xb1: new Cache('https://ws.warframestat.us/xb1', 600000),
  ps4: new Cache('https://ws.warframestat.us/ps4', 600000),
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
  });
  shard.start();
}
