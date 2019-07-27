'use strict';

const cluster = require('cluster');
const Sentry = require('@sentry/node');
const fs = require('fs');

const genManifest = require('./src/tools/generateManifest.js');
const Genesis = require('./src/bot');
let commandManifest = require('./commands.json');

const localShards = parseInt(process.env.LOCAL_SHARDS, 10) || 1;
const shardOffset = parseInt(process.env.SHARD_OFFSET, 10) || 0;

let controlHook;
if (process.env.CONTROL_WH_ID) {
  // eslint-disable-next-line global-require
  const { WebhookClient } = require('discord.js');
  controlHook = new WebhookClient(process.env.CONTROL_WH_ID, process.env.CONTROL_WH_TOKEN);
}

/**
 * Raven client instance for logging errors and debugging events
 */
Sentry.init(process.env.RAVEN_URL, { autoBreadcrumbs: true });

/**
 * Logging functions class
 * @type {Object}
 */
const Logger = require('./src/Logger.js');


const logger = new Logger();
process.on('uncaughtException', (err) => {
  logger.error(err);
});
process.on('unhandledRejection', (err) => {
  logger.error(err);
});

if (process.env.NODE_ENV !== 'production' && localShards < 2) {
  // eslint-disable-next-line global-require
  genManifest();
  commandManifest = JSON.parse(fs.readFileSync('commands.json', 'utf8'));
}

if (cluster.isMaster) {
  // eslint-disable-next-line global-require
  const ClusterManager = require('./src/ClusterManager');
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
    controlHook,
    commandManifest,
  });
  shard.start();
}
