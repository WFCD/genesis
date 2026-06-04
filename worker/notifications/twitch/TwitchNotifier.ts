// @ts-nocheck -- incremental TS migration; worker notification runtime
import TwitchEmbed from '#shared/embeds/TwitchEmbed';
import logger from '#shared/utilities/Logger';
import { platforms } from '#shared/utilities/CommonFunctions';

import Broadcaster from '../Broadcaster';
import { perLanguage } from '../NotifierUtils';

import TwitchMonitor from './TwitchMonitor';

/**
 * Watches for Twitch go-lives and broadcasts them
 */
export default class TwitchNotifier {
  #activePlatforms;
  #broadcaster;
  #monitor;

  constructor({ client, settings, workerCache }) {
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
          } else if (
            streamData.title.includes('Home Time') ||
            streamData.title.includes('Prime Time') ||
            streamData.title.includes('Working From Home') ||
            streamData.title.includes('Community Stream')
          ) {
            id = `${streamData.user_login}.primetime.live`;
          } else {
            id = `${streamData.user_login}.other.live`;
          }
        }

        await perLanguage(async ({ i18n, locale }) => {
          const embed = new TwitchEmbed(streamData, { i18n, locale });
          await Promise.all(
            this.#activePlatforms.map(async (platform) =>
              this.#broadcaster.broadcast(embed, { platform, type: id, locale })
            )
          );
        });
      }
    });
  }
}
