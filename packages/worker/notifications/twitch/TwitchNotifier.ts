// @ts-nocheck -- incremental TS migration; worker notification runtime
import TwitchEmbed from '#shared/embeds/TwitchEmbed';
import logger from '#shared/utilities/Logger';
import { platforms } from '#shared/utilities/CommonFunctions';

import Broadcaster from '../Broadcaster';
import { notifyKey, perLanguage, twitchClaimId } from '../NotifierUtils';

import TwitchMonitor from './TwitchMonitor';

/**
 * Watches for Twitch go-lives and broadcasts them
 */
export default class TwitchNotifier {
  #activePlatforms;
  #broadcaster;
  #monitor;
  #settings;

  constructor({ client, settings, workerCache }) {
    this.#settings = settings;
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
        const id = twitchClaimId(streamData);

        await perLanguage(async ({ i18n, locale }) => {
          const embed = new TwitchEmbed(streamData, { i18n, locale });
          await Promise.all(
            this.#activePlatforms.map(async (platform) => {
              const claimed = await this.#settings.claimNotifiedIds(notifyKey(platform, locale), [id]);
              if (!claimed.length) {
                logger.debug(`skipping duplicate twitch ${id}`, 'Twitch');
                return;
              }
              const sent = await this.#broadcaster.broadcast(embed, { platform, type: id, locale });
              if (!sent) {
                await this.#settings.releaseNotifiedIds(notifyKey(platform, locale), [id]);
              }
            })
          );
        });
      }
    });
  }
}
