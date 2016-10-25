'use strict';

class ClusterManager {
  constructor(cluster, logger, localShards, shardOffset) {
    this.workerIDToShardID = {};
    this.cluster = cluster;
    this.logger = logger;
    this.localShards = localShards;
    this.shardOffset = shardOffset;

    cluster.on('online', (worker) => {
      this.onOnlineWorker(worker);
    });

    cluster.on('exit', (deadWorker, code, signal) => {
      this.onDeadWorker(deadWorker, code || signal);
    });

    // Kill all workers on exit
    process.on('SIGINT', () => {
      Object.keys(cluster.workers).forEach(k => cluster.workers[k].kill('SIGINT'));
    });
  }

  start() {
    this.logger.info(`[Master] Forking ${this.localShards} shards`);
    for (let i = this.shardOffset; i < this.shardOffset + this.localShards; i += 1) {
      this.createNewWorker(i);
    }
  }

  restart() {
    this.logger.info('[Master] Restarting all workers');
    this.workerIDToShardID = {};
    this.cluster.disconnect(() => this.start());
  }

  createNewWorker(shardID) {
    this.logger.info(`[Master] Starting worker for shard ${shardID}`);
    const workerID = this.cluster.fork({ shard_id: shardID });
    this.workerIDToShardID[workerID] = shardID;
  }

  onOnlineWorker(worker) {
    this.logger.info(`[Master] Shard with worker ID ${worker.id} online`);
  }

  onDeadWorker(deadWorker, reason) {
    this.logger.error(`[Master] Worker ${deadWorker.id} died (${reason})`);
    if (!(deadWorker.id in this.workerIDToShardID)) {
      this.logger.error(`[Master] Couldn't find the shard associated with worker ${deadWorker.id}.`);
      this.restart();
    } else {
      const deadShardID = this.workerIDToShardID[deadWorker.id];
      delete this.workerIDToShardID[deadWorker.id];
      this.createNewWorker(deadShardID);
    }
  }
}

module.exports = ClusterManager;
