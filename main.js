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

const logger = require('./src/logger.js');

client.patchGlobal(client, (error) => {
  logger.fatal(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

client.on('error', (error) => {
  logger.error(`Could not report the following error to Sentry: ${error.message}`);
});

if (cluster.isMaster) {
  const localShards = process.env.LOCAL_SHARDS || 1;
  const shardOffset = process.env.SHARD_OFFSET || 0;
  logger.info(`[Master] Forking ${localShards} shards`);

  const workerIDToShardID = {};

  for (let i = shardOffset; i < shardOffset + localShards; i += 1) {
    const worker = cluster.fork({ shard_id: i });
    workerIDToShardID[worker.id] = i;
  }

  cluster.on('online', (worker) => {
    logger.info(`[Master] Shard with worker ID ${worker.id} online`);
  });

  // Restart workers when they die
  cluster.on('exit', (deadWorker, code, signal) => {
    if (!(deadWorker.id in workerIDToShardID)) {
      // We need all shards to be up, report to Sentry and restart the process
      throw new Error(`Shard with worker ID ${deadWorker.id} could not be restarted`);
    }
    const shardID = workerIDToShardID[deadWorker.id];
    delete workerIDToShardID[deadWorker.id];

    logger.error(`[Master] Shard with worker ID ${shardID} died (${code || signal}). Restarting...`);
    const newWorker = cluster.fork({ shard_id: shardID }).id;
    workerIDToShardID[newWorker.id] = shardID;
  });

  // Kill all workers on exit
  process.on('SIGINT', () => {
    Object.keys(cluster.workers).forEach(k => cluster.workers[k].kill('SIGINT'));
  });
} else {
  const totalShards = process.env.SHARDS || 1;
  const shard = new Genesis(process.env.TOKEN, client, {
    shardID: process.env.shard_id,
    shardCount: totalShards,
    prefix: process.env.PREFIX,
    logger,
    owner: process.env.OWNER,
  });
  shard.start();
}
