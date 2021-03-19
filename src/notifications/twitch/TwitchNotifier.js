'use strict';

const TwitchEmbed = require('../../embeds/TwitchEmbed');
const TwitchMonitor = require('./TwitchMonitor');

const Broadcaster = require('../Broadcaster');
const logger = require('../../Logger');

const { platforms } = require('../../CommonFunctions');

require('colors');

/**
 * Watches for Twitch go-lives and broadcasts them
 */
class TwitchNotifier {
  #monitor;

  #broadcaster;

  #activePlatforms;

  constructor({
    client, settings, messageManager, workerCache,
  }) {
    this.#broadcaster = new Broadcaster({
      client,
      settings,
      messageManager,
      workerCache,
    });
    this.#monitor = new TwitchMonitor();
    this.#activePlatforms = platforms;

    this.enabled = true;
  }

  start() {
    try {
      this.#monitor.start();
    } catch (e) {
      logger.error(`initialzation error: ${e.message}`, 'TWITCH');
      return;
    }
    logger.info('Ready', 'Twitch');

    this.#monitor.on('live', async (streamData) => {
      if (this.enabled) {
        if (!streamData.user.display_name) {
          streamData.user = await this.#monitor.spotLoadUser(streamData.user_name);
        }

        const embed = new TwitchEmbed(streamData);
        let id = `${streamData.user_login}.live`;
        // add warframe type filtering for ids...
        if (streamData.user_login === 'warframe') {
          if (streamData.title.includes('Devstream')) {
            id = `${streamData.user_login}.devstream.live`;
          } else if (streamData.title.includes('Home Time')
            || streamData.title.includes('Prime Time')
            || streamData.title.includes('Working From Home')
            || streamData.title.includes('Community Stream')) {
            id = `${streamData.user_login}.primetime.live`;
          } else {
            id = `${streamData.user_login}.other.live`;
          }
        }

        for (const platform of this.#activePlatforms) {
          this.#broadcaster.broadcast(embed, platform, id);
        }
      }
    });
  }
}

module.exports = TwitchNotifier;
