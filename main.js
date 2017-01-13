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

/**
 * Raven client instance for logging errors and debugging events
 */
const client = new Raven.Client(process.env.RAVEN_URL);

/**
 * Logging functions class
 * @type {Object}
 */
const Logger = require('./src/Logger.js');

const logger = new Logger(client);

/**
 * Class that manages the cluster's workers
 * @type {Function}
 */
const ClusterManager = require('./src/ClusterManager.js');

client.install();

client.on('error', (error) => {
  logger.error(`Could not report the following error to Sentry: ${error.message}`);
});

if (cluster.isMaster) {
  const localShards = process.env.LOCAL_SHARDS || 1;
  const shardOffset = process.env.SHARD_OFFSET || 0;

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
  });
  shard.start();
}
