import Discord from 'discord.js';
import logger from '../../utilities/Logger.js';
import Collectors from '../../utilities/Collectors.js';
import {
  checkAndMergeEmbeds,
  chunkFields,
  constructItemEmbeds,
  constructTypeEmbeds,
  createChunkedEmbed,
  embedDefaults,
  emojify,
  games,
  timeDeltaToString,
} from '../../utilities/CommonFunctions.js';
import { cmds, localeMap, platformMap } from '../../resources/index.js';
import Interaction from '../../models/Interaction.js';

const {
  Constants: { ApplicationCommandOptionTypes: Types },
  MessageEmbed,
  Permissions,
} = Discord;

export default class Settings extends Interaction {
  static #negate = '✘';
  static #affirm = '✓';
  static #check = emojify('green_tick');
  static #xmark = emojify('red_tick');
  static #empty = emojify('empty');
  static #globalable = {
    type: Types.BOOLEAN,
    name: 'global',
    description: 'Should this value be set for every channel in the server?',
  };
  static #aliases = {
    allow_inline: 'allowInline',
    allow_custom: 'allowCustom',
    lfg: 'lfgChannel',
    allow_rooms: 'createPrivateChannel',
    auto_locked: 'defaultRoomsLocked',
    auto_text: 'defaultNoText',
    auto_shown: 'defaultShown',
    temp_category: 'tempCategory',
    temp_channel: 'tempChannel',
    elevated_roles: 'elevatedRoles',
  };
  static #rooms = [
    {
      ...cmds['settings.allow_rooms'],
      type: Types.SUB_COMMAND,
      options: [
        {
          ...cmds['settings.allow_rooms.bool'],
          type: Types.BOOLEAN,
          required: true,
        },
      ],
    },
    {
      ...cmds['settings.auto_locked'],
      type: Types.SUB_COMMAND,
      options: [
        {
          ...cmds['settings.auto_locked.bool'],
          type: Types.BOOLEAN,
          required: true,
        },
      ],
    },
    {
      ...cmds['settings.auto_text'],
      type: Types.SUB_COMMAND,
      options: [
        {
          ...cmds['settings.auto_text.bool'],
          type: Types.BOOLEAN,
          required: true,
        },
      ],
    },
    {
      ...cmds['settings.auto_shown'],
      type: Types.SUB_COMMAND,
      options: [
        {
          ...cmds['settings.auto_shown.bool'],
          type: Types.BOOLEAN,
          required: true,
        },
      ],
    },
    {
      ...cmds['settings.temp_category'],
      type: Types.SUB_COMMAND,
      options: [
        {
          ...cmds['settings.temp_category.channel'],
          type: Types.CHANNEL,
          required: true,
        },
      ],
    },
    {
      ...cmds['settings.temp_channel'],
      name: 'temp_channel',
      description: 'Set the channel for creating threads in for private rooms',
      type: Types.SUB_COMMAND,
      options: [
        {
          ...cmds['settings.temp_channel.channel'],
          type: Types.CHANNEL,
          required: true,
        },
      ],
    },
  ];
  static #setLFG = {
    ...cmds['settings.lfg'],
    type: Types.SUB_COMMAND,
    options: [
      {
        ...cmds['settings.lfg.channel'],
        type: Types.CHANNEL,
        required: true,
      },
      {
        ...cmds.platform,
        type: Types.STRING,
        required: true,
        choices: platformMap,
      },
    ],
  };
  static #custom = [
    {
      ...cmds['settings.allow_custom'],
      type: Types.SUB_COMMAND,
      options: [
        {
          ...cmds['settings.allow_custom.bool'],
          type: Types.BOOLEAN,
          required: true,
        },
        Settings.#globalable,
      ],
    },
    {
      ...cmds['settings.allow_inline'],
      type: Types.SUB_COMMAND,
      options: [
        {
          ...cmds['settings.allow_inline.bool'],
          type: Types.BOOLEAN,
          required: true,
        },
        Settings.#globalable,
      ],
    },
  ];
  static #settingsCommands = [
    {
      ...cmds['settings.language'],
      type: Types.SUB_COMMAND,
      options: [
        {
          ...cmds['settings.language.str'],
          type: Types.STRING,
          choices: localeMap,
          required: true,
        },
      ],
    },
    {
      ...cmds['settings.platform'],
      type: Types.SUB_COMMAND,
      options: [
        {
          ...cmds.platform,
          type: Types.STRING,
          choices: platformMap,
          required: true,
        },
      ],
    },
    {
      ...cmds['settings.ephemerate'],
      type: Types.SUB_COMMAND,
      options: [
        {
          type: Types.BOOLEAN,
          name: 'value',
          description: 'Make replies from interactions show in this channel?',
          required: true,
        },
      ],
    },
    {
      ...cmds['settings.elevated_roles'],
      type: Types.SUB_COMMAND,
      options: [
        {
          ...cmds['settings.elevated_roles.str'],
          type: Types.STRING,
          required: true,
        },
      ],
    },
    ...(games.includes('CUST_CMDS') ? Settings.#custom : []),
    ...(games.includes('UTIL') ? [Settings.#setLFG] : []),
    ...(games.includes('ROOMS') ? this.#rooms : []),
  ].filter((s) => s);

  /**
   * Wrap channel value into a string
   * @param {string} val channel id
   * @returns {string|*}
   */
  static #wrapChannelValue(val) {
    if (val !== this.#negate) {
      return `<#${val}>`;
    }
    return val;
  }

  static #wrapRoleValue(val) {
    if (val !== this.#negate) {
      return `<@&${val}>`;
    }
    return val;
  }

  static async #resolveBoolean(channel, setting, settings, db) {
    if (settings) {
      return settings[setting] === '1' ? this.#affirm : this.#negate;
    }
    return (await db.getChannelSetting(channel, setting)) === '1' ? this.#affirm : this.#negate;
  }

  /**
   * this.#gather settings into one or more embeds
   * @param {CommandContext} ctx context object
   * @param {Discord.TextChannel} channel Channel to bind settings from
   * @param {Discord.ThreadChannel} [thread] Optional thread
   * @returns {Promise<Array<Discord.MessageEmbed>>}
   */
  static async #gather(ctx, channel, thread) {
    const page = new MessageEmbed(embedDefaults);
    const settings = await ctx.settings.getChannelSettings(channel, [
      'language',
      'platform',
      'createPrivateChannel',
      'allowInline',
      'allowCustom',
      'settings.cc.ping',
      'defaultRoomsLocked',
      'defaultNoText',
      'defaultShown',
      'defaultRoles',
      'tempCategory',
      'lfgChannel',
      'lfgChannel.ps4',
      'lfgChannel.xb1',
      'lfgChannel.swi',
      'modRole',
      'ephemerate',
      'tempChannel',
    ]);

    page.setTitle('General Settings');
    page.addFields([
      {
        name: 'Language',
        value: settings.language || ctx.settings.defaults.language,
        inline: true,
      },
      {
        name: 'Platform',
        value: settings.platform || ctx.settings.defaults.platform,
        inline: true,
      },
      {
        name: 'Mod Role',
        value: this.#wrapRoleValue(settings.modRole || this.#negate),
        inline: true,
      },
      {
        name: 'Allow Inline',
        value: await this.#resolveBoolean(channel, 'allowInline', settings),
        inline: true,
      },
      {
        name: 'Allow Custom',
        value: await this.#resolveBoolean(channel, 'allowCustom', settings),
        inline: true,
      },
      {
        name: 'Ping Custom',
        value: await this.#resolveBoolean(channel, 'settings.cc.ping', settings),
        inline: true,
      },
      {
        name: 'Ephemerate',
        value: await this.#resolveBoolean(channel, 'ephemerate', settings),
        inline: true,
      },
      {
        name: '🔽 Private Room Settings 🔽',
        value: '_ _',
        inline: false,
      },
      {
        name: 'Enabled?',
        value: await this.#resolveBoolean(channel, 'createPrivateChannel', settings),
        inline: true,
      },
      {
        name: 'Lock?',
        value: await this.#resolveBoolean(channel, 'defaultRoomsLocked', settings),
        inline: true,
      },
      {
        name: 'No Text?',
        value: await this.#resolveBoolean(channel, 'defaultNoText', settings),
        inline: true,
      },
      {
        name: 'Hidden?',
        value: await this.#resolveBoolean(channel, 'defaultShown', settings),
        inline: true,
      },
      {
        name: '🔽 LFG Settings 🔽',
        value: '_ _',
        inline: false,
      },
    ]);

    const tempCategory =
      settings.tempCategory !== '0' && typeof settings.tempCategory !== 'undefined'
        ? settings.tempCategory
        : this.#negate;

    let lfgVal = '';
    if (settings.lfgChannel) {
      lfgVal += `**PC:** ${this.#wrapChannelValue(settings.lfgChannel)}\n`;
    }
    if (settings['lfgChannel.ps4']) {
      lfgVal += `**PS4:** ${this.#wrapChannelValue(settings['lfgChannel.ps4'])}\n`;
    }
    if (settings['lfgChannel.xb1']) {
      lfgVal += `**XB1:** ${this.#wrapChannelValue(settings['lfgChannel.xb1'])}\n`;
    }
    if (settings['lfgChannel.swi']) {
      lfgVal += `**Switch:** ${this.#wrapChannelValue(settings['lfgChannel.swi'])}\n`;
    }
    if (
      !(settings.lfgChannel || settings['lfgChannel.ps4'] || settings['lfgChannel.xb1'] || settings['lfgChannel.swi'])
    ) {
      lfgVal = this.#negate;
    }
    page.addFields([
      {
        name: 'LFG',
        value: lfgVal,
        inline: false,
      },
      {
        name: 'Temp Channels',
        value: `Category: ${this.#wrapChannelValue(tempCategory)}\nChannel: ${
          settings.tempChannel ? this.#wrapChannelValue(settings.tempChannel) : this.#negate
        }`,
        inline: true,
      },
    ]);

    const embeds = [page];

    // end of page 1
    const items = await ctx.settings.getTrackedItems(channel, thread);
    const trackedItems = constructItemEmbeds(items);

    const events = await ctx.settings.getTrackedEventTypes(channel, thread);
    const trackedEvents = constructTypeEmbeds(events);

    // Guild Pings
    const guildPings = await ctx.settings.getPingsForGuild(channel.guild);
    const pingParts = guildPings
      .filter((obj) => obj.thing && obj.text)
      .map((obj) => `**${obj.thing}**: ${obj.text}`)
      .join('\n');

    checkAndMergeEmbeds(embeds, trackedItems);
    checkAndMergeEmbeds(embeds, trackedEvents);
    checkAndMergeEmbeds(embeds, createChunkedEmbed(pingParts, 'Pings', '\n'));

    const stats = await ctx.settings.getGuildStats(channel.guild);
    embeds.push(
      new MessageEmbed({
        title: ctx.i18n`Most Used Commands`,
        color: 0x444444,
        description: stats
          .filter((s, i) => i < 10)
          .map((s) => `\`${s.id.padEnd(25, ' ')} | ${`${s.count}`.padStart(4, ' ')}\``)
          .join('\n'),
      })
    );
    return embeds;
  }

  static #getMentions = (content, guild) =>
    content
      .trim()
      .replace(/[<>@&]/gi, ' ')
      .split(' ')
      .filter((id) => id)
      .map((id) => guild.roles.cache.get(id.trim()));

  static enabled = true;
  static elevated = true;
  static command = {
    ...cmds.settings,
    defaultMemberPermissions: Permissions.FLAGS.MANAGE_GUILD,
    options: [
      {
        ...cmds['settings.set'],
        type: Types.SUB_COMMAND_GROUP,
        options: this.#settingsCommands,
      },
      {
        ...cmds['settings.clear'],
        type: Types.SUB_COMMAND_GROUP,
        options: [
          {
            name: 'pings',
            description: 'Clear tracking pings',
            type: Types.SUB_COMMAND,
          },
          {
            name: 'temp_category',
            description: 'Clear temp category for private channels',
            type: Types.SUB_COMMAND,
          },
          {
            name: 'all',
            description: 'Clear all settings on the bot for this server',
            type: Types.SUB_COMMAND,
          },
        ],
      },
      {
        ...cmds['settings.get'],
        type: Types.SUB_COMMAND,
      },
      {
        ...cmds['settings.diag'],
        type: Types.SUB_COMMAND,
      },
    ],
  };

  static async commandHandler(interaction, ctx) {
    // args
    const { options } = interaction;
    const ephemeral = ctx.ephemerate;
    await interaction.deferReply();
    let action;
    try {
      action = options?.getSubcommandGroup();
    } catch (e) {
      try {
        action = options?.getSubcommand();
      } catch (ex) {
        ctx.logger.error(ex);
        return undefined;
      }
    }
    let field = options.getSubcommand();
    let value = (options?.get?.('value') || options?.get?.('channel') || options.get?.('platform'))?.value;
    const platform = options.get?.('platform')?.value;

    // validation
    if (!action) return interaction.editReply(ctx.i18n`No action`);
    if (['set', 'clear'].includes(action) && !field) return interaction.editReply(ctx.i18n`No field`);

    if (field === 'auto_text') value = !value;

    const isThread = interaction.channel.isThread();
    const channel = isThread ? interaction.channel.parent : interaction.channel;
    const thread = isThread ? interaction.channel : undefined;

    switch (action) {
      case 'clear':
        switch (field) {
          case 'pings':
            await ctx.settings.removePings(interaction?.guild?.id);
            return interaction.editReply({ content: 'pings cleared', ephemeral });
          case 'temp_category':
            await ctx.settings.deleteChannelSetting(channel, 'tempChannel');
            await ctx.settings.deleteChannelSetting(channel, 'tempCategory');
            return interaction.editReply({ content: 'cleared temp_category', ephemeral });
          case 'all':
            // wipe settings!!!
            await interaction.deferReply({ ephemeral: true });
            const { guild } = interaction;
            await ctx.settings.removeGuild(guild.id);
            await Promise.all(guild.channels.cache.map((cachedChannel) => ctx.settings.stopTracking(cachedChannel)));
            return interaction.editReply('server-wide purge complete');
          default:
            break;
        }
        break;
      case 'set':
        if (typeof value === 'undefined') return interaction.editReply(ctx.i18n`No value`);
        logger.info(field);
        switch (field) {
          case 'lfg':
            field = this.#aliases[field];
            field = platform === 'pc' ? field : `${field}.${platform}`;
          case 'allow_inline':
          case 'allow_custom':
          case 'allow_rooms':
          case 'auto_locked':
          case 'auto_shown':
          case 'auto_text':
          case 'temp_category':
          case 'temp_channel':
            field = this.#aliases[field] || field;
          case 'ephemerate':
          case 'platform':
            await ctx.settings.setChannelSetting(channel, field, value);
            return interaction.editReply(`set ${field} to \`${value}\``);
          case 'elevated_roles':
            field = this.#aliases[field] || field;
            value = this.#getMentions(value, interaction.guild)
              .map((role) => role.id)
              .join(',');
            return ctx.handler.recalcPerms(value, interaction.guild);
          case 'language':
            await ctx.settings.setGuildSetting(interaction.guild, field, value);
            return interaction.editReply({ content: `set ${field} to \`${value}\``, ephemeral });
          default:
            return interaction.editReply(options?.getSubcommand());
        }
      case 'get':
        const pages = await this.#gather(ctx, channel, thread);
        return Collectors.paged(interaction, pages, ctx);
      case 'diag':
        const embed = new MessageEmbed();
        embed.setTitle(`Diagnostics for Shard ${interaction.guild.shardId + 1}/${interaction.client.ws.shards.size}`);
        embed.addFields([
          {
            name: 'Discord WS',
            value: `${this.#check} ${interaction.client.ws.ping.toFixed(2)}ms`,
            inline: true,
          },
        ]);

        // this.#check what permissions the bot has in the current channel
        const perms = channel.permissionsFor(interaction.client.user.id);

        // role management
        /** @type string[] */
        const rolePermTokens = [];
        rolePermTokens.push(
          `${perms.has(Permissions.FLAGS.MANAGE_ROLES) ? this.#check : this.#xmark} Permission Present`
        );
        rolePermTokens.push(`${this.#empty} Bot role position: ${interaction.guild.me.roles.highest.position}`);

        /** @type Discord.EmbedField[] */
        const fields = chunkFields(rolePermTokens, 'Can Manage Roles', '\n');
        embed.addFields(fields);

        // Tracking
        const trackingReadinessTokens = [
          `${
            perms.has(Permissions.FLAGS.MANAGE_WEBHOOKS) ? `${this.#check}  Can` : `${this.#xmark} Cannot`
          } Manage Webhooks`,
        ];

        const trackables = {
          events: await ctx.settings.getTrackedEventTypes(channel, thread),
          items: await ctx.settings.getTrackedItems(channel, thread),
        };
        trackingReadinessTokens.push(
          trackables.events.length
            ? `${this.#check} ${trackables.events.length} Events Tracked`
            : `${this.#xmark} No Events tracked`
        );
        trackingReadinessTokens.push(
          trackables.items.length
            ? `${this.#check} ${trackables.items.length} Items Tracked`
            : `${this.#xmark} No Items tracked`
        );

        embed.addFields([
          {
            name: 'Trackable Ready',
            value: trackingReadinessTokens.join('\n'),
            inline: false,
          },
          {
            // General
            name: 'General Ids',
            value: `Guild: \`${interaction.guild.id}\`\nChannel: \`${channel.id}\`${
              thread ? `\nThread: \`${thread.id}\`` : ''
            }`,
          },
        ]);

        embed.setTimestamp(new Date());
        embed.setFooter({ text: `Uptime: ${timeDeltaToString(interaction.client.uptime)}` });

        return interaction.editReply({ embeds: [embed], ephemeral: ctx.ephemerate });
      default:
        break;
    }
    return interaction.editReply({ content: 'not happening', ephemeral });
  }
}
