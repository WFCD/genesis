import TwitchEmbed from '../../embeds/TwitchEmbed.js';
import TwitchMonitor from './TwitchMonitor.js';

import Broadcaster from '../Broadcaster.js';
import logger from '../../utilities/Logger.js';

import { platforms } from '../../utilities/CommonFunctions.js';
import { perLanguage } from '../NotifierUtils.js';
import 'colors';

/**
 * Watches for Twitch go-lives and broadcasts them
 */
export default class TwitchNotifier {
  #monitor;

  #broadcaster;

  #activePlatforms;

  constructor({
    client, settings, workerCache,
  }) {
    this.#broadcaster = new Broadcaster({
      client,
      settings,
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

        perLanguage(async ({ i18n, locale }) => {
          const embed = new TwitchEmbed(streamData, { i18n, locale });
          for (const platform of this.#activePlatforms) {
            this.#broadcaster.broadcast(embed, platform, id);
          }
        });
      }
    });
  }
}
