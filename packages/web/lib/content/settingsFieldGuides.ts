import { featureFlags, type FeatureFlag } from '@/lib/settings/featureFlags';

export type SettingsFieldHelp = {
  guideSlug: string;
  sectionId?: string;
  tooltip: string;
  featureFlag?: FeatureFlag;
};

export const settingsFieldHelp: Record<string, SettingsFieldHelp> = {
  ephemerate: {
    guideSlug: 'getting-started',
    sectionId: 'ephemeral-replies',
    tooltip:
      'When enabled, slash command replies are only visible to the user who ran the command. Other members will not see the response.',
  },
  allowCustom: {
    guideSlug: 'guild-settings',
    sectionId: 'custom-commands',
    tooltip: 'Allows this channel to use guild custom commands created with /cc or the dashboard.',
  },
  allowInline: {
    guideSlug: 'guild-settings',
    sectionId: 'custom-commands',
    tooltip: 'Allows inline command syntax (prefix + command) in this channel, not only slash commands.',
  },
  'settings.cc.ping': {
    guideSlug: 'guild-settings',
    sectionId: 'custom-commands',
    tooltip: 'When a custom command mentions users or roles, Genesis will send those pings.',
  },
  deleteExpired: {
    guideSlug: 'tracking',
    sectionId: 'delete-expired',
    featureFlag: 'deleteExpiredNotifications',
    tooltip: 'Automatically removes tracking notification messages after the tracked event expires.',
  },
  elevatedRoles: {
    guideSlug: 'guild-settings',
    sectionId: 'elevated-roles',
    tooltip:
      'Roles listed here can manage tracking, pings, and custom commands without full Manage Server permission.',
  },
  'tracking.search': {
    guideSlug: 'tracking',
    tooltip: 'Search for worldstate events or items to add to this channel or thread.',
  },
  'tracking.add': {
    guideSlug: 'tracking',
    tooltip: 'Select one or more trackables from search results, then click Add selected before saving.',
  },
  'rooms.createPrivateChannel': {
    guideSlug: 'guild-settings',
    sectionId: 'private-rooms',
    tooltip: 'Enables automatic private voice rooms when members join a configured template channel.',
  },
  'rooms.defaultRoomsLocked': {
    guideSlug: 'guild-settings',
    sectionId: 'private-rooms',
    tooltip: 'New private rooms start locked so only the owner and invited members can join.',
  },
  'rooms.defaultNoText': {
    guideSlug: 'guild-settings',
    sectionId: 'private-rooms',
    tooltip: 'When enabled, new private rooms include a text channel. Disable to create voice-only rooms.',
  },
  'rooms.defaultShown': {
    guideSlug: 'guild-settings',
    sectionId: 'private-rooms',
    tooltip: 'When enabled, new private rooms are hidden from the channel list until the owner shares them.',
  },
  'rooms.tempCategory': {
    guideSlug: 'guild-settings',
    sectionId: 'private-rooms',
    tooltip: 'Category where new private voice channels are created.',
  },
  'rooms.tempChannel': {
    guideSlug: 'guild-settings',
    sectionId: 'private-rooms',
    tooltip: 'Optional text channel associated with new private rooms (for room management panels).',
  },
};

export const getSettingsFieldHelp = (key: string) => {
  const help = settingsFieldHelp[key];
  if (help.featureFlag && !featureFlags[help.featureFlag]) return undefined;
  return help;
};

export const guideHref = (help: SettingsFieldHelp) =>
  help.sectionId ? `/guides/${help.guideSlug}#${help.sectionId}` : `/guides/${help.guideSlug}`;
