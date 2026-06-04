import { User, type Guild, type Role, type TextChannel } from 'discord.js';
import SQL from 'sql-template-strings';

import type { CommandContext } from '#shared/types/context';
import createI18n from '#shared/utilities/i18n';
import { platforms } from '#shared/utilities/CommonFunctions';
import { i18n } from '#shared/resources/index';

import type { DefaultSettings } from './DatabaseDeps';
import type ChannelSettingsRepository from './repositories/ChannelSettingsRepository';

const avatarPrefix = `https://cdn.discordapp.com/avatars/${process.env.CLIENT_ID}`;

type MutableCommandContext = CommandContext & Record<string, unknown>;

const asBool = (value: unknown, fallback: unknown): boolean => {
  if (typeof value === 'undefined') return Boolean(fallback);
  return value === '1' || value === true;
};

type ChannelInput = TextChannel | User | { id: string; guild?: Guild };

export interface CommandContextDeps {
  scope: string;
  defaults: DefaultSettings;
  bot: { owner?: string };
  query(query: ReturnType<typeof SQL>): Promise<unknown>;
  channels: ChannelSettingsRepository;
  isBlacklisted(userId: string, guildId: string | number): Promise<boolean>;
}

/** Build per-interaction context from channel settings rows. */
export async function buildCommandContext(
  deps: CommandContextDeps,
  channel: ChannelInput,
  user?: User
): Promise<CommandContext> {
  await deps.channels.getSetting(channel, 'prefix');

  if (!('id' in channel) || !channel.id) {
    channel = { id: channel as unknown as string };
  }

  const settings = ['webhookId', 'webhookToken', 'webhookName', 'webhookAvatar', 'language', 'platform'];

  if (deps.scope === 'bot') {
    settings.push(
      ...[
        'platform',
        'prefix',
        'allowCustom',
        'allowInline',
        'defaultRoomsLocked',
        'defaultNoText',
        'defaultShown',
        'createPrivateChannel',
        'tempCategory',
        'lfgChannel',
        'settings.cc.ping',
        'language',
        'respond_to_settings',
        'lfgChannel.swi',
        'lfgChannel.ps4',
        'lfgChannel.xb1',
        'delete_after_respond',
        'ephemerate',
        'modRole',
        'tempChannel',
      ]
    );

    if (platforms.length > 4) {
      platforms.forEach((platform, index) => {
        if (index > 3) {
          settings.push(`lfgChannel.${platform}`);
        }
      });
    }
  }

  const query = SQL`SELECT setting, val FROM settings where channel_id = ${channel.id}
      and setting in (`;
  settings.forEach((setting, index) => {
    query.append(index !== settings.length - 1 ? SQL`${setting}, ` : SQL`${setting}`);
  });
  query.append(SQL`);`);
  const result = await deps.query(query);
  const rows = result?.[0] as Array<{ setting: string; val: string }> | undefined;

  let context: MutableCommandContext = {};

  if (rows) {
    rows
      .map((row) => ({
        setting: row.setting,
        value: row.val,
      }))
      .forEach((row) => {
        if (row.setting === 'webhookAvatar' && !row.value.startsWith('http')) {
          row.value = `${avatarPrefix}/${row.value}.png`;
        }
        if (row.setting.indexOf('webhook') === -1) {
          context[row.setting] = row.value;
        } else {
          if (!context.webhook) context.webhook = { id: '', token: '' };
          context.webhook[`${row.setting.replace('webhook', '').toLowerCase()}`] = row.value;
        }
      });

    if (!context.platform) {
      context.platform = deps.defaults.platform;
      await deps.channels.setSetting(channel, 'platform', deps.defaults.platform);
    }

    if (!context.prefix) {
      context.prefix = deps.defaults.prefix;
    }

    if (!context.language) {
      context.language = deps.defaults.language.substr(0, 2);
      await deps.channels.setSetting(channel, 'language', deps.defaults.language.substr(0, 2));
    } else if (context.language.length > 2) {
      await deps.channels.setSetting(channel, 'language', context.language.substr(0, 2));
      context.language = context.language.substr(0, 2);
    }

    context.allowCustom = asBool(context.allowCustom, deps.defaults.allowCustom);
    context.allowInline = asBool(context.allowInline, deps.defaults.allowInline);
    context.defaultRoomsLocked = asBool(context.defaultRoomsLocked, deps.defaults.defaultRoomsLocked);
    context.defaultNoText = asBool(context.defaultNoText, deps.defaults.defaultNoText);
    context.defaultShown = asBool(context.defaultShown, deps.defaults.defaultShown);
    context['settings.cc.ping'] = asBool(context['settings.cc.ping'], deps.defaults['settings.cc.ping']);
    context.createPrivateChannel = asBool(context.createPrivateChannel, deps.defaults.createPrivateChannel);

    if (!(context.webhook?.id && context.webhook.token)) {
      context.webhook = undefined;
    }

    const guildChannel = channel as TextChannel;
    if (context.tempCategory && guildChannel?.guild?.channels?.cache.has(String(context.tempCategory).trim())) {
      context.tempCategory = guildChannel.guild.channels.cache.get(String(context.tempCategory).trim());
    } else {
      context.tempCategory = undefined;
    }

    if (context.tempChannel && guildChannel?.guild?.channels.cache.has(String(context.tempChannel).trim())) {
      context.tempChannel = guildChannel.guild.channels.cache.get(String(context.tempChannel).trim());
    } else {
      context.tempChannel = undefined;
    }

    const lfgChannel = context.lfgChannel as string | undefined;
    if (lfgChannel) {
      context.lfg = {};
      context.lfg.pc = guildChannel?.guild?.channels.cache.get(lfgChannel);
      delete context.lfgChannel;
    }

    if (context.delete_after_respond) {
      context.deleteCommand = parseInt(String(context.delete_after_respond), 10) === 1;
      delete context.delete_after_respond;
    } else {
      context.deleteCommand = deps.defaults.delete_after_respond as boolean;
    }

    platforms.forEach((platform) => {
      const lfgKey = `lfgChannel.${platform}`;
      if (context[lfgKey]) {
        if (!context.lfg) {
          context.lfg = {};
        }
        context.lfg[platform] = guildChannel?.guild?.channels.cache.get(String(context[lfgKey]));
        delete context[lfgKey];
      }
    });

    if (typeof context.respond_to_settings === 'undefined') {
      context.respondToSettings = deps.defaults.respond_to_settings as boolean;
    } else {
      context.respondToSettings = context.respond_to_settings === '1';
      delete context.respond_to_settings;
    }

    if (channel instanceof User) context.ephemerate = false;
    else context.ephemerate = asBool(context.ephemerate, true);

    if (context.modRole && guildChannel?.guild) {
      context.modRole = (await guildChannel.guild.roles.fetch(String(context.modRole))) as Role;
    }
  } else {
    context = {
      platform: deps.defaults.platform,
      prefix: deps.defaults.prefix,
      language: deps.defaults.language,
      allowCustom: asBool(undefined, deps.defaults.allowCustom),
      allowInline: asBool(undefined, deps.defaults.allowInline),
      defaultRoomsLocked: asBool(undefined, deps.defaults.defaultRoomsLocked),
      defaultNoText: asBool(undefined, deps.defaults.defaultNoText),
      createPrivateChannel: asBool(undefined, deps.defaults.createPrivateChannel),
      'settings.cc.ping': asBool(undefined, deps.defaults['settings.cc.ping']),
      respondToSettings: deps.defaults.respond_to_settings as boolean,
      deleteCommand: deps.defaults.delete_after_respond as boolean,
      ephemerate: true,
    };
  }

  if (user) {
    const guildId = 'guild' in channel && channel.guild ? channel.guild.id : 0;
    context.isBlacklisted = await deps.isBlacklisted(user.id, guildId);
    context.isOwner = user.id === deps.bot.owner;
  }

  context.channel = channel as TextChannel;
  context.i18n = createI18n(i18n, context.language ?? deps.defaults.language) as CommandContext['i18n'];
  return context;
}
