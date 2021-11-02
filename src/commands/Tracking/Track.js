'use strict';

const Command = require('../../models/Command.js');
const {
  getEventsOrItems,
  trackablesFromParameters,
  getChannel,
  sendTrackInstructionEmbeds,
  captures,
  checkAndMergeEmbeds,
  setupPages,
  constructItemEmbeds,
  constructTypeEmbeds,
  emojify,
} = require('../../CommonFunctions');

/**
 * Track an event or item
 */
class Track extends Command {
  constructor(bot) {
    super(bot, 'settings.track', 'track', 'Track something', 'UTIL');
    this.usages = [
      { description: 'Show tracking command for tracking events', parameters: [] },
      { description: 'Track an event or events', parameters: ['event(s) to track'] },
    ];
    this.regex = new RegExp(`^${this.call}(?:\\s+(${captures.trackables})*)?(?:\\s+in\\s+(${captures.channel}|here))?`, 'i');
    this.requiresAuth = true;
  }

  async run(message, ctx) {
    const unsplitItems = getEventsOrItems(message);
    const roomId = new RegExp(`${captures.channel}|here`, 'ig');

    if (!unsplitItems.length) {
      return this.#failure(message, ctx.prefix);
    }
    const trackables = trackablesFromParameters(unsplitItems);
    if (!(trackables.events.length || trackables.items.length)) {
      return this.#failure(message, ctx.prefix);
    }
    trackables.events = trackables.events
      .filter((elem, pos) => trackables.events.indexOf(elem) === pos);
    trackables.items = trackables.items
      .filter((elem, pos) => trackables.items.indexOf(elem) === pos);

    const channelParam = message.strippedContent.match(roomId)
      ? message.strippedContent.match(roomId)[0].trim().replace(/<|>|#/ig, '')
      : undefined;

    const channel = getChannel(channelParam, message);

    if (trackables.events.length) {
      await this.settings.trackEventTypes(channel, trackables.events);
    }
    if (trackables.items.length) {
      await this.settings.trackItems(channel, trackables.items);
    }
    if (ctx.respondToSettings) {
      await this.#notifyCurrent(channel, message);
    }
    this.messageManager.notifySettingsChange(message, true, true);

    if (!ctx.webhook) {
      this.#generateWebhook(message);
    }
    return this.messageManager.statuses.SUCCESS;
  }

  /**
   * Generate webhook for channel
   * @param {Discord.Message} message message containing channel context
   */
  async #generateWebhook (message) {
    if (message.channel.permissionsFor(this.bot.client.user).has('MANAGE_WEBHOOKS')) {
      let webhook;
      let existingWebhooks;
      let setupMsg;
      try {
        setupMsg = await message.reply('Setting up webhook...');
        existingWebhooks = (await message.channel.fetchWebhooks())
          .filter(w => w.type === 'Incoming'
            && w?.owner?.id === message?.client?.user?.id
            && !!w.token);
      } catch (e) {
        this.logger.error(e);
        await message.reply(`${emojify('red_tick')} Cannot set up webhooks: failed to get existing.`);
      }

      if (existingWebhooks.size) {
        const temp = existingWebhooks.first();
        webhook = {
          id: temp.id,
          token: temp.token,
          name: this.settings.defaults.username,
          avatar: this.settings.defaults.avatar,
        };
        setupMsg.delete();
      } else {
        try {
          webhook = await message.channel.createWebhook(this.settings.defaults.username, {
            avatar: this.settings.defaults.avatar,
            reason: 'Automated Webhook setup for Notifications',
          });
          this.logger.error(webhook.url);
        } catch (e) {
          this.logger.error(e);
          await message.reply(`${emojify('red_tick')} Cannot set up webhooks: failed to make new.`);
        }
      }
      if (webhook.url) {
        try {
          await message.reply(`${emojify('green_tick')} Webhook setup complete.`);
          await webhook.send(':diamond_shape_with_a_dot_inside: Webhook initialized');
          if (!webhook.avatar.startsWith('http')) webhook.avatar = this.settings.defaults.avatar;
        } catch (e) {
          this.logger.error(e);
          await message.reply(`${emojify('red_tick')} Cannot set up webhooks: failed to send.`);
        }
      } else {
        this.logger.debug(`webhook for ${message.channel.id} already set up...`);
      }
      this.bot.settings.setChannelWebhook(message.channel, webhook);
    } else {
      await message.reply(`${emojify('red_tick')} Cannot set up webhooks: missing permissions.`);
    }
  }

  /**
   * Notify the origin channel of the currently tracked trackables
   * @param {Discord.TextChannel} channel channel to notify
   * @param {Discord.Message} message message to respond to
   */
  async #notifyCurrent (channel, message) {
    const pages = [];
    const items = await this.settings.getTrackedItems(channel);
    const trackedItems = constructItemEmbeds(items);
    const events = await this.settings.getTrackedEventTypes(channel);
    const trackedEvents = constructTypeEmbeds(events);
    checkAndMergeEmbeds(pages, trackedItems);
    checkAndMergeEmbeds(pages, trackedEvents);
    if (pages.length) {
      return setupPages(pages, { message, settings: this.settings, mm: this.messageManager });
    }
    return message.reply('Nothing Tracked');
  }

  /**
   * Notify channel of trackable instructions
   * @param {Discord.Message} message message to respond do
   * @param {string} prefix configured channel prefix
   */
  async #failure (message, prefix) {
    await sendTrackInstructionEmbeds({
      message,
      prefix,
      call: this.call,
      settings: this.settings,
      mm: this.messageManager,
    });
    return this.messageManager.statuses.FAILURE;
  }
}

module.exports = Track;
