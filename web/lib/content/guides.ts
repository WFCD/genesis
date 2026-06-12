export type GuideSection = {
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
          'Elevated roles can manage tracking, pings, and custom commands without full Manage Server permission.',
        ],
      },
    ],
  },
];

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
