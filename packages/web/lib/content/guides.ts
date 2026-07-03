export type GuideSection = {
  id?: string;
  heading?: string;
  paragraphs: string[];
  list?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  summary: string;
  sections: GuideSection[];
};

/** Add dashboard instruction guides here. Each entry appears on the signed-in home page. */
export const guides: Guide[] = [
  {
    slug: 'getting-started',
    title: 'Getting started',
    summary: 'Sign in, pick a server, and open channel settings from the sidebar.',
    sections: [
      {
        paragraphs: [
          'Sign in with Discord using an account that has Manage Server on the guild you want to configure.',
          'Active server icons in the left sidebar mean Genesis already has data for that guild. Gray icons mean the bot has not registered channels there yet.',
        ],
        list: [
          'Click a server icon to open the guild dashboard.',
          'Choose a text channel or thread in the channel list.',
          'Use channel tabs for general, LFG, and tracking settings. Guild-wide settings (rooms, pings, etc.) live on the server page.',
        ],
      },
      {
        id: 'ephemeral-replies',
        heading: 'Ephemeral slash replies',
        paragraphs: [
          'The Ephemeral slash replies setting controls whether Genesis posts command responses only to the user who ran the command.',
          'When enabled (Yes), other members will not see slash command output in the channel. When disabled (No), replies are posted publicly like a normal message.',
          'This applies per channel and inherits from the parent channel when commands are run inside a thread.',
        ],
      },
    ],
  },
  {
    slug: 'tracking',
    title: 'Worldstate tracking',
    summary: 'Configure which alerts Genesis posts in a channel or thread.',
    sections: [
      {
        paragraphs: [
          'Open a channel or thread and switch to the Tracking tab. Existing tracked events and items load from the database automatically.',
          'Search for trackables, add them to the selection, then click Add selected. Save tracking when you are done.',
        ],
        list: [
          'Events cover grouped alert types such as fissures or cetus cycles.',
          'Items cover individual drop or resource notifications.',
          'Thread tracking is separate from the parent channel.',
        ],
      },
      {
        id: 'delete-expired',
        heading: 'Delete expired notifications',
        paragraphs: [
          'When Delete expired notifications is enabled on a channel, Genesis removes tracking alert messages after the underlying worldstate event ends.',
          'This keeps busy alert channels tidy without manual cleanup.',
        ],
      },
    ],
  },
  {
    slug: 'guild-settings',
    title: 'Guild-wide settings',
    summary: 'Elevated roles, custom commands, and pings.',
    sections: [
      {
        paragraphs: [
          'The guild dashboard tabs mirror the in-Discord settings command groups. Existing values are loaded when you open each tab.',
        ],
      },
      {
        id: 'elevated-roles',
        heading: 'Elevated roles',
        paragraphs: [
          'Elevated roles can manage tracking, pings, and custom commands without full Manage Server permission.',
          'Enter role IDs separated by commas, or click role chips to add them quickly.',
        ],
      },
      {
        id: 'custom-commands',
        heading: 'Custom commands',
        paragraphs: [
          'Guild custom commands are created with /cc or the Custom Commands tab on the guild dashboard.',
          'Per-channel settings control whether custom and inline commands are allowed, and whether pings in custom command responses are delivered.',
        ],
        list: [
          'Allow custom commands — enables /cc commands in the channel.',
          'Allow inline commands — enables prefix-style invocation in addition to slash commands.',
          'Ping on custom commands — delivers @user and @role mentions in custom command responses.',
        ],
      },
      {
        id: 'private-rooms',
        heading: 'Private rooms',
        paragraphs: [
          'Private rooms let members create temporary voice channels from a template. Configure defaults on the guild Rooms tab.',
        ],
        list: [
          'Private rooms enabled — turns the feature on for the server.',
          'Auto-lock — new rooms start locked to the owner.',
          'Allow text — include a text channel with each new room.',
          'Hide new rooms — rooms are hidden until the owner shares them.',
          'Temp category — where new voice channels are created.',
          'Temp text channel — optional channel for room management panels.',
        ],
      },
    ],
  },
];

export const getGuide = (slug: string) => guides.find((guide) => guide.slug === slug);
