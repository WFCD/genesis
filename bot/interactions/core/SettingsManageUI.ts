import {
  ChannelSelectMenuBuilder,
  LabelBuilder,
  ModalBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextInputBuilder,
} from '@discordjs/builders';
import { ChannelType, TextInputStyle, type ChatInputCommandInteraction, type ModalSubmitInteraction } from 'discord.js';

import { localeMap, platformMap } from '#shared/resources/';
import { trackableEvents, withEphemeral } from '#shared/utilities/CommonFunctions';

import TrackingManageUI from '../tracking/TrackingManageUI';

const PREFIX = 'sm';
const SESSION_TTL_MS = 15 * 60 * 1000;

export type ManagePanel = 'general' | 'commands' | 'rooms' | 'rooms_adv' | 'tracking' | 'pings';

type ManageSession = {
  userId: string;
  channelId: string;
  threadId?: string;
  panel: ManagePanel;
  expiresAt: number;
};

const sessions = new Map<string, ManageSession>();

const sessionKey = (userId: string, channelId: string, threadId?: string) =>
  `${userId}:${channelId}:${threadId ?? '0'}`;

const parseId = (customId: string) => {
  const parts = customId.split(':');
  return {
    channelId: parts[1],
    threadId: parts[2] === '0' ? undefined : parts[2],
    component: parts.slice(3).join(':'),
  };
};

const buildId = (channelId: string, threadId: string | undefined, component: string) =>
  `${PREFIX}:${channelId}:${threadId ?? '0'}:${component}`;

type ModalChainInteraction = ModalSubmitInteraction & {
  showModal(modal: ModalBuilder): Promise<unknown>;
};

const yesNoOptions = (isOn: boolean) => [
  new StringSelectMenuOptionBuilder().setLabel('Yes').setValue('1').setDefault(isOn),
  new StringSelectMenuOptionBuilder().setLabel('No').setValue('0').setDefault(!isOn),
];

const boolFromSettings = (settings: Record<string, string | undefined>, key: string) =>
  settings[key] === '1' ? true : settings[key] === '0' ? false : undefined;

const panelOptions = (current?: ManagePanel) =>
  (
    [
      ['General', 'general'],
      ['Commands', 'commands'],
      ['Private Rooms', 'rooms'],
      ['Room Channels', 'rooms_adv'],
      ['Tracking', 'tracking'],
      ['Pings', 'pings'],
    ] as const
  ).map(([label, value]) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(label)
      .setValue(value)
      .setDefault(value === current)
  );

export default class SettingsManageUI {
  static #getSession(userId: string, channelId: string, threadId?: string) {
    const key = sessionKey(userId, channelId, threadId);
    const session = sessions.get(key);
    if (!session || session.expiresAt < Date.now()) {
      sessions.delete(key);
      return undefined;
    }
    return session;
  }

  static #touchSession(session: ManageSession) {
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    sessions.set(sessionKey(session.userId, session.channelId, session.threadId), session);
  }

  static #createSession(
    interaction: ChatInputCommandInteraction,
    channel,
    thread?,
    panel: ManagePanel = 'general'
  ): ManageSession {
    const session: ManageSession = {
      userId: interaction.user.id,
      channelId: channel.id,
      threadId: thread?.id,
      panel,
      expiresAt: Date.now() + SESSION_TTL_MS,
    };
    this.#touchSession(session);
    return session;
  }

  static async #loadChannelSettings(ctx, channel) {
    return ctx.settings.channels.getSettings(channel, [
      'language',
      'platform',
      'modRole',
      'ephemerate',
      'allowCustom',
      'allowInline',
      'settings.cc.ping',
      'createPrivateChannel',
      'defaultRoomsLocked',
      'defaultNoText',
      'defaultShown',
      'tempCategory',
      'tempChannel',
    ]);
  }

  static async start(interaction: ChatInputCommandInteraction, ctx, channel, thread?) {
    if (interaction.deferred || interaction.replied) {
      throw new Error('SettingsManageUI.start must not run after defer/reply');
    }

    this.#createSession(interaction, channel, thread);
    return interaction.showModal(this.#buildPickModal(channel.id, thread?.id));
  }

  static async handleModalSubmit(interaction: ModalSubmitInteraction, ctx, channel, thread?) {
    const { channelId, threadId, component } = parseId(interaction.customId);
    if (channelId !== channel.id || (threadId ?? undefined) !== (thread?.id ?? undefined)) {
      return interaction.reply(withEphemeral(true, { content: 'This form is for a different channel.' }));
    }

    const session = this.#getSession(interaction.user.id, channelId, threadId);
    if (!session) {
      return interaction.reply(withEphemeral(true, { content: 'Session expired — run manage again.' }));
    }

    if (interaction.user.id !== session.userId) {
      return interaction.reply(withEphemeral(true, { content: 'Only the user who opened this form can submit it.' }));
    }

    this.#touchSession(session);

    if (component === 'pick') {
      const panel = interaction.fields.getStringSelectValues('panel')[0] as ManagePanel;
      session.panel = panel;
      if (panel === 'tracking') {
        await interaction.deferReply(withEphemeral(ctx.ephemerate));
        sessions.delete(sessionKey(session.userId, channelId, threadId));
        return TrackingManageUI.start(interaction, ctx, channel, thread);
      }
      const chain = interaction as ModalChainInteraction;
      const modal = await this.#buildPanelModal(session, ctx, channel);
      return chain.showModal(modal);
    }

    await interaction.deferReply(withEphemeral(ctx.ephemerate));

    if (component === 'general') {
      const language = interaction.fields.getStringSelectValues('language')[0];
      const platform = interaction.fields.getStringSelectValues('platform')[0];
      const roles = interaction.fields.getSelectedRoles('modrole', false);
      const roleId = roles ? [...roles.keys()][0] : undefined;
      await ctx.settings.channels.setGuildSetting(interaction.guild, 'language', language);
      await ctx.settings.channels.setSetting(channel, 'platform', platform);
      if (roleId) {
        await ctx.settings.channels.setSetting(channel, 'modRole', roleId);
      } else {
        await ctx.settings.channels.deleteSetting(channel, 'modRole');
      }
      sessions.delete(sessionKey(session.userId, channelId, threadId));
      return interaction.editReply({ content: 'General settings saved.' });
    }

    if (component === 'commands') {
      await ctx.settings.channels.setSetting(
        channel,
        'ephemerate',
        interaction.fields.getStringSelectValues('ephemerate')[0]
      );
      await ctx.settings.channels.setSetting(
        channel,
        'allowCustom',
        interaction.fields.getStringSelectValues('allowCustom')[0]
      );
      await ctx.settings.channels.setSetting(
        channel,
        'allowInline',
        interaction.fields.getStringSelectValues('allowInline')[0]
      );
      await ctx.settings.channels.setSetting(
        channel,
        'settings.cc.ping',
        interaction.fields.getStringSelectValues('settings.cc.ping')[0]
      );
      sessions.delete(sessionKey(session.userId, channelId, threadId));
      return interaction.editReply({ content: 'Command settings saved.' });
    }

    if (component === 'rooms') {
      await ctx.settings.channels.setSetting(
        channel,
        'createPrivateChannel',
        interaction.fields.getStringSelectValues('createPrivateChannel')[0]
      );
      await ctx.settings.channels.setSetting(
        channel,
        'defaultRoomsLocked',
        interaction.fields.getStringSelectValues('defaultRoomsLocked')[0]
      );
      const noText = interaction.fields.getStringSelectValues('defaultNoText')[0];
      await ctx.settings.channels.setSetting(channel, 'defaultNoText', noText === '1' ? '0' : '1');
      await ctx.settings.channels.setSetting(
        channel,
        'defaultShown',
        interaction.fields.getStringSelectValues('defaultShown')[0]
      );
      sessions.delete(sessionKey(session.userId, channelId, threadId));
      return interaction.editReply({ content: 'Private room settings saved.' });
    }

    if (component === 'rooms_adv') {
      const category = interaction.fields.getSelectedChannels('tempCategory', false, [ChannelType.GuildCategory]);
      const textChannel = interaction.fields.getSelectedChannels('tempChannel', false, [
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
      ]);
      const categoryId = category ? [...category.keys()][0] : undefined;
      const channelIdValue = textChannel ? [...textChannel.keys()][0] : undefined;
      if (categoryId) {
        await ctx.settings.channels.setSetting(channel, 'tempCategory', categoryId);
      } else {
        await ctx.settings.channels.deleteSetting(channel, 'tempCategory');
      }
      if (channelIdValue) {
        await ctx.settings.channels.setSetting(channel, 'tempChannel', channelIdValue);
      } else {
        await ctx.settings.channels.deleteSetting(channel, 'tempChannel');
      }
      sessions.delete(sessionKey(session.userId, channelId, threadId));
      return interaction.editReply({ content: 'Room channel settings saved.' });
    }

    if (component === 'pings') {
      const pingKey = interaction.fields.getStringSelectValues('pingpick')[0];
      const text = interaction.fields.getTextInputValue('prepend').trim();
      if (!pingKey || pingKey === 'none') {
        return interaction.editReply({ content: 'Select a ping target.' });
      }
      const isEvent = Object.values(trackableEvents).flat().includes(pingKey);
      const opts = isEvent ? { events: [pingKey], items: [] } : { events: [], items: [pingKey] };
      if (text) {
        await ctx.settings.notifications.addPings(interaction.guild, opts, text);
      } else {
        await ctx.settings.notifications.removePing(interaction.guild, pingKey);
      }
      sessions.delete(sessionKey(session.userId, channelId, threadId));
      return interaction.editReply({
        content: text ? `Set prepend for \`${pingKey}\`.` : `Cleared prepend for \`${pingKey}\`.`,
      });
    }

    return interaction.editReply({ content: 'Unknown settings form.' });
  }

  static #buildPickModal(channelId: string, threadId?: string) {
    return new ModalBuilder()
      .setCustomId(buildId(channelId, threadId, 'pick'))
      .setTitle('Manage Settings')
      .addLabelComponents(
        new LabelBuilder()
          .setLabel('Section')
          .setDescription('Choose which settings to edit')
          .setStringSelectMenuComponent(
            new StringSelectMenuBuilder()
              .setCustomId('panel')
              .setPlaceholder('Settings section')
              .addOptions(...panelOptions())
          )
      );
  }

  static #boolLabel(customId: string, label: string, current?: boolean) {
    return new LabelBuilder()
      .setLabel(label)
      .setStringSelectMenuComponent(
        new StringSelectMenuBuilder().setCustomId(customId).addOptions(...yesNoOptions(current ?? false))
      );
  }

  static async #buildPanelModal(session: ManageSession, ctx, channel) {
    const settings = await this.#loadChannelSettings(ctx, channel);
    const modal = new ModalBuilder().setCustomId(buildId(session.channelId, session.threadId, session.panel)).setTitle(
      {
        general: 'General Settings',
        commands: 'Command Settings',
        rooms: 'Private Rooms',
        rooms_adv: 'Room Channels',
        pings: 'Ping Prepend',
      }[session.panel] ?? 'Settings'
    );

    switch (session.panel) {
      case 'general':
        modal.addLabelComponents(
          new LabelBuilder().setLabel('Language').setStringSelectMenuComponent(
            new StringSelectMenuBuilder().setCustomId('language').addOptions(
              ...localeMap.map((l) =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(l.name)
                  .setValue(l.value)
                  .setDefault(l.value === (settings.language || 'en').slice(0, 2))
              )
            )
          ),
          new LabelBuilder().setLabel('Platform').setStringSelectMenuComponent(
            new StringSelectMenuBuilder().setCustomId('platform').addOptions(
              ...platformMap.map((p) =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(p.name)
                  .setValue(p.value)
                  .setDefault(p.value === (settings.platform || 'pc'))
              )
            )
          ),
          new LabelBuilder()
            .setLabel('Mod role')
            .setDescription('Leave empty to clear')
            .setRoleSelectMenuComponent(
              new RoleSelectMenuBuilder().setCustomId('modrole').setMinValues(0).setMaxValues(1)
            )
        );
        break;
      case 'commands':
        modal.addLabelComponents(
          this.#boolLabel('ephemerate', 'Ephemeral slash replies', boolFromSettings(settings, 'ephemerate')),
          this.#boolLabel('allowCustom', 'Allow custom commands', boolFromSettings(settings, 'allowCustom')),
          this.#boolLabel('allowInline', 'Allow inline commands', boolFromSettings(settings, 'allowInline')),
          this.#boolLabel('settings.cc.ping', 'Ping on custom commands', boolFromSettings(settings, 'settings.cc.ping'))
        );
        break;
      case 'rooms':
        modal.addLabelComponents(
          this.#boolLabel(
            'createPrivateChannel',
            'Private rooms enabled',
            boolFromSettings(settings, 'createPrivateChannel')
          ),
          this.#boolLabel(
            'defaultRoomsLocked',
            'Auto-lock new rooms',
            boolFromSettings(settings, 'defaultRoomsLocked')
          ),
          this.#boolLabel('defaultNoText', 'No text in new rooms', settings.defaultNoText === '0'),
          this.#boolLabel('defaultShown', 'Hide new rooms', boolFromSettings(settings, 'defaultShown'))
        );
        break;
      case 'rooms_adv':
        modal.addLabelComponents(
          new LabelBuilder()
            .setLabel('Temp category')
            .setDescription('Leave empty to clear')
            .setChannelSelectMenuComponent(
              new ChannelSelectMenuBuilder()
                .setCustomId('tempCategory')
                .setChannelTypes(ChannelType.GuildCategory)
                .setMinValues(0)
                .setMaxValues(1)
            ),
          new LabelBuilder()
            .setLabel('Temp text channel')
            .setDescription('Leave empty to clear')
            .setChannelSelectMenuComponent(
              new ChannelSelectMenuBuilder()
                .setCustomId('tempChannel')
                .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setMinValues(0)
                .setMaxValues(1)
            )
        );
        break;
      case 'pings': {
        const guildPings = await ctx.settings.notifications.getPingsForGuild(channel.guild);
        const pingOptions =
          guildPings.length > 0
            ? guildPings.slice(0, 25).map((p) =>
                new StringSelectMenuOptionBuilder()
                  .setLabel(p.thing.slice(0, 100))
                  .setDescription(p.text?.slice(0, 100) || 'No prepend')
                  .setValue(p.thing)
              )
            : [new StringSelectMenuOptionBuilder().setLabel('No pings configured').setValue('none')];

        modal.addLabelComponents(
          new LabelBuilder().setLabel('Ping target').setStringSelectMenuComponent(
            new StringSelectMenuBuilder()
              .setCustomId('pingpick')
              .setPlaceholder('Select ping')
              .addOptions(...pingOptions)
          ),
          new LabelBuilder()
            .setLabel('Prepend text')
            .setDescription('Leave blank to clear prepend')
            .setTextInputComponent(
              new TextInputBuilder()
                .setCustomId('prepend')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
                .setMaxLength(500)
            )
        );
        break;
      }
      default:
        break;
    }

    return modal;
  }

  static isManageModal(customId: string) {
    return customId.startsWith(`${PREFIX}:`);
  }
}
