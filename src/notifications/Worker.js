'use strict';

const Notifier = require('./Notifier');
const FeedsNotifier = require('./FeedsNotifier');
const TwitchNotifier = require('./TwitchNotifier');

const WorldStateCache = require('../WorldStateCache');
const MessageManager = require('../settings/MessageManager');
const Rest = require('../tools/RESTWrapper');
const Database = require('../settings/Database');

const { logger } = require('./NotifierUtils');

const rest = new Rest();
const db = new Database();

const deps = {};

class Worker {
  constructor() {
    /**
     * Objects holding worldState data, one for each platform
     * @type {Object.<WorldStateCache>}
     */
    this.worldStates = {};

    const worldStateTimeout = process.env.WORLDSTATE_TIMEOUT || 60000;
    ['pc', 'ps4', 'xb1', 'swi']
      .forEach((platform) => {
        this.worldStates[platform] = new WorldStateCache(platform, worldStateTimeout, this.logger);
      });
  }

  /**
   * Start the worker notifier systems
   * @returns {Promise} [description]
   */
  async start() {
    try {
      deps.settings = db;
      deps.client = rest;
      deps.worldStates = this.worldStates;

      await rest.init();

      this.messageManager = new MessageManager(deps);
      deps.messageManager = this.messageManager;

      this.notifier = new Notifier(deps);
      this.feedNotifier = new FeedsNotifier(deps);
      this.twitchNotifier = new TwitchNotifier(deps);

      await this.notifier.start();
      this.twitchNotifier.start();
      this.feedNotifier.start();
    } catch (e) {
      logger.error(e);
    }
  }
}

const worker = new Worker();

worker.start();
