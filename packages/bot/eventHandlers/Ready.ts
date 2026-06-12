import { ActivityType, ChannelType, Events } from 'discord.js';

import { fromNow, games, timeDeltaToMinutesString } from '#shared/utilities/CommonFunctions';

import type Genesis from '../bot';
import Handler from '../models/BaseEventHandler';
import { shouldDeleteRoomCategory } from '../interactions/channels/roomActions';

import DynamicVoiceHandler from './DynamicVoiceHandler';

const max = {
  cetus: {
    day: 6000000,
    night: 3000000,
  },
  vallis: {
    warm: 400000,
    cold: 1600000 - 400000,
  },
};

const cycleTimeout = 60000;

const startupTimeout = Number.parseInt(process.env.READY_FORCE || '3600000', 10);

const presenceActivityTypes = {
  PLAYING: ActivityType.Playing,
  WATCHING: ActivityType.Watching,
  LISTENING: ActivityType.Listening,
  STREAMING: ActivityType.Streaming,
  COMPETING: ActivityType.Competing,
};

export default class OnReadyHandle extends Handler {
  channelTimeout = 60000;

  constructor(bot: Genesis) {
    super(bot, 'handlers.onReady', Events.ClientReady);
    setTimeout(() => {
      this.logger.info(`[Cluster] Forcing readiness...`);
      this.execute.bind(this)();
    }, startupTimeout);
  }

  async execute() {
    try {
      if (this.bot?.readyToExecute) return;
      this.logger.silly(`Running ${this.id} for ${this.event}`);
      this.logger.info('[Cluster] READY');

      await this.#notifyUp();

      this.settings.init();
      this.bot.readyToExecute = true;

      await this.#updatePresence();
      this.setupAdditionalHandlers();
    } catch (e) {
      this.logger.error(e);
    }
  }

  async #notifyUp() {
    if (this.bot.controlHook && (process.env.LOG_LEVEL || 'ERROR').toLowerCase() === 'debug') {
      try {
        await this.bot.controlHook.edit({
          name: this.bot.client.user.username,
          avatar: this.bot.client.user.displayAvatarURL().replace('.webp', '.png').replace('.webm', '.gif'),
        });
      } catch (e) {
        this.logger.info("couldn't use webhook");
      }
      await this.bot.controlHook.send({
        embeds: [
          {
            description: `Shards **${this.bot.shards[0] + 1} - ${
              this.bot.shards[this.bot.shards.length - 1] + 1
            }** ready\n<t:${Math.floor(Date.now() / 1000)}:R>`,
            color: 0x2b90ec,
          },
        ],
      });
    }
  }

  setupAdditionalHandlers() {
    setInterval(this.#updatePresence.bind(this), cycleTimeout);
    setInterval(this.#checkPrivateRooms.bind(this), cycleTimeout);
    this.bot.dynamicVoiceHandler = new DynamicVoiceHandler(this.client, this.logger, this.settings);
  }

  async #getWarframePresence(base: string) {
    const defPres = `0m: ❄️ • 0m: 🌙`;
    const cetusState = await this.bot.ws.get('cetusCycle');
    const vallisState = await this.bot.ws.get('vallisCycle');

    if (vallisState || cetusState) {
      let vsFromNow = fromNow(new Date(vallisState.expiry));
      let csFromNow = fromNow(new Date(cetusState.expiry));

      if (vsFromNow < 0) {
        vsFromNow = (vallisState.isWarm ? max.vallis.cold : max.vallis.warm) + vsFromNow;
        vallisState.isWarm = !vallisState.isWarm;
      }

      if (csFromNow < 0) {
        csFromNow = (cetusState.isDay ? max.cetus.night : max.cetus.day) + csFromNow;
        cetusState.isDay = !cetusState.isDay;
      }

      const vs = vallisState
        ? `${timeDeltaToMinutesString(vsFromNow) || '0m'}: ${vallisState.isWarm ? '🔥' : '❄️'} • `
        : '';
      const cs = cetusState ? `${timeDeltaToMinutesString(csFromNow) || '0m'}: ${cetusState.isDay ? '☀️' : '🌙'}` : '';
      const wfPres = `${vs}${cs}`;
      if (wfPres === defPres) {
        return base;
      }
      return wfPres;
    }
    return base;
  }

  async #updatePresence() {
    try {
      const baseMsg = process.env.BASE_PRES_MSG || `/help`;
      const activityKey = process.env.BASE_PRES_ACT || 'PLAYING';
      const activityType = presenceActivityTypes[activityKey] ?? ActivityType.Playing;

      let wfPresence;
      try {
        wfPresence = games.includes('WARFRAME') ? await this.#getWarframePresence(baseMsg) : undefined;
      } catch (e) {
        this.logger.warn('Could not get Warframe presence data.');
      }
      const presence = wfPresence || baseMsg;
      this.client.user.setPresence({
        status: 'online',
        afk: false,
        activities: [
          {
            name: presence,
            type: activityType,
          },
        ],
      });
    } catch (error) {
      this.logger.silly(error);
    }
  }

  async #checkPrivateRooms() {
    if (!games.includes('UTIL')) return;
    this.logger.silly('Checking private rooms...');
    const privateRooms = await this.settings.privateRooms.getPrivateRooms();
    this.logger.silly(`Private rooms... ${privateRooms.length}`);
    await Promise.all(
      privateRooms.map(async (room) => {
        if (room && (room.textChannel || room.category || room.voiceChannel)) {
          const now = new Date();
          if (
            now.getTime() + now.getTimezoneOffset() * 60000 - room.createdAt > this.channelTimeout &&
            (!room.voiceChannel || room.voiceChannel.members.size === 0)
          ) {
            if (room.textChannel && room.textChannel.deletable) {
              this.logger.silly(`Deleting text channel... ${room.textChannel.id}`);
              await room.textChannel.delete();
            }
            if (room.voiceChannel && room.voiceChannel.deletable) {
              this.logger.silly(`Deleting voice channel... ${room.voiceChannel.id}`);
              await room.voiceChannel.delete();
            }
            if (shouldDeleteRoomCategory(room)) {
              this.logger.silly(`Deleting category... ${room.category!.id}`);
              await room.category!.delete();
            }
            await this.settings.privateRooms.deletePrivateRoom(room);
          }
        } else if (room) {
          await this.settings.privateRooms.deletePrivateRoom({
            textChannel: room.textId ? { id: room.textId } : undefined,
            voiceChannel: { id: room.voiceId },
            category: { id: room.categoryId },
            guild: { id: room.guildId },
          });
        }
      })
    );
  }

  async #repopulateChannels() {
    const channels = this.client.channels.cache.filter((channel) => channel.type === ChannelType.GuildText);
    await Promise.all(
      Array.from(channels.values()).map((channel) => this.settings.guilds.addGuildTextChannel(channel))
    );
  }
}
