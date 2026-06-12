import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Client,
} from 'discord.js';

import type { CommandContext } from '#shared/types/context';
import Collectors from '#shared/utilities/Collectors';
import { withEphemeral } from '#shared/utilities/CommonFunctions';

import Settings from './Settings';

const PREFIX = 'su';
const SESSION_TTL_MS = 15 * 60 * 1000;

type SuServerSession = {
  slash: ChatInputCommandInteraction;
  guildId: string;
  userId: string;
  expiresAt: number;
};

const sessions = new Map<string, SuServerSession>();

export default class SuServerUI {
  static rememberServerLookup(interaction: ChatInputCommandInteraction, guildId: string) {
    sessions.set(interaction.id, {
      slash: interaction,
      guildId,
      userId: interaction.user.id,
      expiresAt: Date.now() + SESSION_TTL_MS,
    });
  }

  static serverComponents(slashInteractionId: string) {
    return [
      new ActionRowBuilder<ButtonBuilder>({
        components: [
          new ButtonBuilder()
            .setCustomId(`${PREFIX}:${slashInteractionId}:settings`)
            .setLabel('Show Settings')
            .setStyle(ButtonStyle.Primary),
        ],
      }),
    ];
  }

  static isComponent(customId: string) {
    const parts = customId.split(':');
    return parts[0] === PREFIX && parts[2] === 'settings';
  }

  static async handleComponent(button: ButtonInteraction, ctx: CommandContext) {
    const slashId = button.customId.split(':')[1];
    const session = sessions.get(slashId);
    if (!session || session.expiresAt < Date.now() || session.userId !== button.user.id) {
      return button.reply(withEphemeral(true, { content: 'Session expired. Run `/su server` again.' }));
    }

    const channel = await this.#resolveSettingsChannel(button.client, ctx, session.guildId);
    if (!channel) {
      return button.reply(withEphemeral(true, { content: 'No text channel found for settings in that server.' }));
    }

    await button.deferUpdate();
    const pages = await Settings.gatherEmbedPages(ctx, channel, undefined, session.guildId);
    return Collectors.dynamic(session.slash, pages, ctx);
  }

  static async #resolveSettingsChannel(client: Client, ctx: CommandContext, guildId: string) {
    const guilds = await ctx.settings.channels.getGuilds();
    for (const channelId of guilds[guildId]?.channels ?? []) {
      const channel = await client.channels.fetch(channelId).catch(() => undefined);
      if (channel?.isTextBased()) return channel;
    }

    const guild = await client.guilds.fetch(guildId).catch(() => undefined);
    if (!guild) return undefined;
    await guild.channels.fetch().catch(() => undefined);
    return guild.channels.cache.find((entry) => entry.isTextBased());
  }
}
