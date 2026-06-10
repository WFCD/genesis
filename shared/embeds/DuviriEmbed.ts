import { optimizeImage, toTitleCase, wikiBase, wfcdn } from '#shared/utilities/CommonFunctions';
import { rTime } from '#shared/utilities/Wrappers';

import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

const duviriThumb = optimizeImage(wfcdn('Tennocon2022Display.png'), 128);
const moodWiki = `${wikiBase}Duviri#Mood_Spirals`;

type MoodKey = 'joy' | 'anger' | 'envy' | 'sorrow' | 'fear';

const MOOD_ORDER: MoodKey[] = ['joy', 'anger', 'envy', 'sorrow', 'fear'];

const MOOD_INFO: Record<
  MoodKey,
  { label: string; courtier: string; damage: string; locations: string; color: number }
> = {
  joy: {
    label: 'Joy',
    courtier: 'Mathila',
    damage: 'Void damage and status; Trauma Clamps also heal nearby players',
    locations: 'Archarbor and The Amphitheater',
    color: 0xf1c40f,
  },
  anger: {
    label: 'Anger',
    courtier: 'Lodun',
    damage: 'Heat damage and status',
    locations: "Kullervo's Hold, Owl Puzzle, The Amphitheater",
    color: 0xc0392b,
  },
  envy: {
    label: 'Envy',
    courtier: 'Bombastine',
    damage: 'Toxin damage and status',
    locations: 'Archarbor and The Amphitheater',
    color: 0x27ae60,
  },
  sorrow: {
    label: 'Sorrow',
    courtier: 'Luscinia',
    damage: 'Cold damage and status',
    locations: 'Archarbor; Kullervo may appear in spiral stages',
    color: 0x5dade2,
  },
  fear: {
    label: 'Fear',
    courtier: 'Sythel',
    damage: 'Electricity damage and status',
    locations: "Kullervo's Hold and The Amphitheater",
    color: 0x8e44ad,
  },
};

const normalizeMood = (state: string): MoodKey | undefined => {
  const key = state?.toLowerCase() as MoodKey;
  return MOOD_ORDER.includes(key) ? key : undefined;
};

const nextMood = (current: MoodKey) => MOOD_ORDER[(MOOD_ORDER.indexOf(current) + 1) % MOOD_ORDER.length];

type DuviriChoice = {
  category?: string;
  choices?: string[];
};

type DuviriCycle = {
  state: string;
  expiry: string;
  choices?: DuviriChoice[];
};

export default class DuviriEmbed extends BaseEmbed {
  constructor(state: DuviriCycle, { i18n, locale }: EmbedBuildOptions) {
    super(locale);

    const moodKey = normalizeMood(state.state) ?? 'joy';
    const mood = MOOD_INFO[moodKey];
    const next = MOOD_INFO[nextMood(moodKey)];

    this.title = i18n`Duviri — ${mood.label} Mood Spiral`;
    this.color = mood.color;
    this.thumbnail = { url: duviriThumb };
    this.url = moodWiki;

    this.description = [
      i18n`Time remaining until ${next.label}: ${rTime(state.expiry)}`,
      i18n`Each mood spiral lasts **2 hours** and changes landscape, POIs, and enemy damage.`,
      i18n`Spirals are 6-stage runs (4 on Duviri, 2 in the Undercroft) ending with the Orowyrm.`,
      i18n`Isleweaver is unaffected — scenery stays Joy and Murmur get no spiral damage bonus.`,
      i18n`[Mood Spirals on the Wiki](${moodWiki})`,
    ].join('\n\n');

    this.fields = [
      {
        name: i18n`Spiral Guide`,
        value: i18n`Led by **${mood.courtier}**. Other courtiers roam Duviri during spirals that are not their own.`,
        inline: false,
      },
      {
        name: i18n`Enemy & Trauma Clamp Damage`,
        value: mood.damage,
        inline: false,
      },
      {
        name: i18n`Notable Locations`,
        value: mood.locations,
        inline: false,
      },
    ];

    state.choices?.forEach((group) => {
      if (!group.choices?.length) return;
      const category = group.category?.toLowerCase();
      const name =
        category === 'hard'
          ? i18n`Hard Mode Choices`
          : category === 'normal'
            ? i18n`Warframe Choices`
            : i18n`${toTitleCase(group.category ?? 'Cycle')} Choices`;
      this.fields.push({
        name,
        value: group.choices.join(' • '),
        inline: false,
      });
    });

    this.footer.text = i18n`${next.label} spiral starts `;
    this.timestamp = new Date(state.expiry).getTime();
  }
}
