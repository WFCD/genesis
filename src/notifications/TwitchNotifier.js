'use strict';

const { ApiClient } = require('twitch');
const WebHookListener = require('twitch-webhooks').default;

const TwitchEmbed = require('../embeds/TwitchEmbed');
const Broadcaster = require('./Broadcaster');
const { platforms } = require('../CommonFunctions');
const logger = require('../Logger');

require('colors');

/**
 * Watches for Twitch go-lives and broadcasts them
 */
class TwitchNotifier {
  constructor({
    client, settings, messageManager, workerCache,
  }) {
    this.broadcaster = new Broadcaster({
      client,
      settings,
      messageManager,
      workerCache,
    });

    this.lastStartedAtTime = null;

    if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
      const id = process.env.TWITCH_CLIENT_ID;
      const secret = process.env.TWITCH_CLIENT_SECRET;
      this.client = ApiClient.withClientCredentials(id, secret);
    } else {
      logger.debug('[Twitch] Cannot initialize Twitch Notifier... invalid credentials');
    }

    this.subs = {};
  }

  async start() {
    if (!this.client) return;

    try {
      this.listener = await WebHookListener.create(this.client, {
        host: process.env.TWITCH_HOST || 'localhost',
        port: 8090,
        reverseProxy: { port: 443, ssl: true },
      });

      this.listener.listen();

      await this.listenToStreams();
    } catch (e) {
      logger.error(`initialzation error: ${e.message}`);
      return;
    }
    logger.info(`[${'Twitch'.purple}] Ready`);
  }

  /**
   * Set up subscription for twitch user id
   * @param  {string}  sub twitch user id
   * @returns {Promise}
   */
  async subscribe(sub) {
    const user = await this.client.helix.users.getUserByName(sub);

    const subscription = this.listener.subscribeToStreamChanges(user.id, async (stream) => {
      if (stream) {
        const twitchEmbed = new TwitchEmbed(stream, user);
        let id = `${sub}.live`;
        // add warframe type filtering for ids...
        if (sub === 'warframe') {
          if (stream.title.includes('Home Time') || stream.title.includes('Prime Time')) {
            id = `${sub}.primetime.live`;
          } else if (stream.title.includes('Devstream')) {
            id = `${sub}.devstream.live`;
          } else {
            id = `${sub}.other.live`;
          }
        }

        // broadcast it!
        platforms.forEach((platform) => {
          this.broadcaster.broadcast(twitchEmbed, platform, id);
        });
      }
    });
    this.subs[sub] = subscription;
    logger.debug(`[Twitch] listening for '${sub}' stream changes...`);
  }

  /**
   * Set up listening to streams
   */
  async listenToStreams() {
    if (!(this.client && this.listener)) return;

    const subs = require('../resources/twitch.json');

    const subPromises = [];

    subs.forEach((sub) => {
      subPromises.push(this.subscribe(sub));
    });

    await Promise.all(subPromises);

    process.on('exit', () => {
      Object.entries(subs).forEach(subscription => subscription.stop());
      logger.debug('[Twitch] Subscriptions unregistered...');
    });
  }
}

module.exports = TwitchNotifier;
