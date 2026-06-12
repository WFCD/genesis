import { hasGuildAdminPermission } from '#shared/utilities/discordPermissions';

export type OAuthGuild = {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
};

export type GuildWithBotStatus = OAuthGuild & {
  botPresent: boolean;
};

export const filterManageableGuilds = (guilds: OAuthGuild[] = []) =>
  guilds.filter((guild) => hasGuildAdminPermission(guild.permissions));

export const guildIconUrl = (guild: Pick<OAuthGuild, 'id' | 'icon'>, size = 64) => {
  if (!guild.icon) return null;
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=${size}`;
};

export const guildInitials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
