'use strict';

const cluster = require('cluster');
const Raven = require('raven');

const Genesis = require('./src/bot');
const TwitterCache = require('./src/TwitterCache.js');

let controlHook;
if (process.env.CONTROL_WH_ID) {
  // eslint-disable-next-line global-require
  const { WebhookClient } = require('discord.js');
  controlHook = new WebhookClient(process.env.CONTROL_WH_ID, process.env.CONTROL_WH_TOKEN);
}

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
  // eslint-disable-next-line no-console
  console.error(`Could not report the following error to Sentry: ${error.message}`);
});

const logger = new Logger(client);
process.on('uncaughtException', (err) => {
  logger.error(err);
});
process.on('unhandledRejection', (err) => {
  logger.error(err);
});

const twitterTimeout = process.env.TWITTER_TIMEOUT || 60000;
const twitterCache = new TwitterCache({
  clientInfo: 
  {
    consumer_key: process.env.TWITTER_KEY, 
    consumer_secret: process.env.TWITTER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  },
  toWatch:
  [
    "@Cam_Rogers",
    "@PabloPoon",
    "@rebbford",
    "@sj_sinclair"
  ]
},twitterTimeout, logger);

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line global-require
  require('./src/tools/generateManifest.js')();
}

if (cluster.isMaster) {
  const localShards = parseInt(process.env.LOCAL_SHARDS, 10) || 1;
  const shardOffset = parseInt(process.env.SHARD_OFFSET, 10) || 0;
  // eslint-disable-next-line global-require
  const ClusterManager = require('./src/ClusterManager');
  const clusterManager = new ClusterManager(cluster, logger, localShards, shardOffset);
  clusterManager.start();
} else {
  const totalShards = parseInt(process.env.SHARDS, 10) || 1;
  const shard = new Genesis(process.env.TOKEN, logger, twitterCache, {
    shardId: parseInt(process.env.shard_id, 10),
    shardCount: totalShards,
    prefix: process.env.PREFIX,
    logger,
    owner: process.env.OWNER,
    controlHook,
    // eslint-disable-next-line global-require
    commandManifest: require('./commands.json'),
  });
  shard.start();
}
