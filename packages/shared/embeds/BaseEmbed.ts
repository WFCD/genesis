import { EmbedBuilder, type APIEmbedField } from 'discord.js';

const defaults = {
  url: process.env.EMBED_URL || 'https://warframestat.us',
  icon: process.env.EMBED_ICON_URL || 'https://docs.warframestat.us/wfcd_logo_color.png',
};

type TimestampInput = Date | number | string | null | undefined;

type LegacyEmbedAuthor = {
  name?: string;
  iconURL?: string;
  url?: string;
};

type LegacyEmbedAsset = {
  url?: string;
  height?: number;
  width?: number;
};

type LegacyEmbedFooter = {
  text?: string;
  iconURL?: string;
};

function normalizeTimestamp(value: TimestampInput): Date | number | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return value;
  return new Date(value);
}

export default class BaseEmbed extends EmbedBuilder {
  locale?: string;

  /** v13-style embed assignments; wired in {@link installLegacyProperties}. */
  declare color: number | null;
  declare title: string | null;
  declare description: string | null;
  declare url: string | null;
  declare timestamp: Date | number | null;
  declare fields: APIEmbedField[] | undefined;
  declare image: LegacyEmbedAsset;
  declare thumbnail: LegacyEmbedAsset;
  declare footer: LegacyEmbedFooter;
  declare author: LegacyEmbedAuthor;

  constructor(locale?: string) {
    super({
      url: defaults.url,
      description: '_ _',
      footer: {
        text: 'Sent',
        iconURL: defaults.icon,
      },
      timestamp: new Date().toISOString(),
      thumbnail: {
        url: undefined,
      },
    });
    if (locale) this.locale = locale;
    this.installLegacyProperties();
  }

  /**
   * discord.js v13 MessageEmbed assigned color, footer.text, etc. directly.
   * v14 EmbedBuilder uses setters — keep old embed subclasses working.
   */
  private installLegacyProperties() {
    const embed = this;

    Object.defineProperties(this, {
      color: {
        get() {
          return embed.data.color;
        },
        set(value: number | null) {
          embed.setColor(value);
        },
        enumerable: true,
        configurable: true,
      },
      title: {
        get() {
          return embed.data.title;
        },
        set(value: string | null) {
          embed.setTitle(value);
        },
        enumerable: true,
        configurable: true,
      },
      description: {
        get() {
          return embed.data.description;
        },
        set(value: string | null) {
          embed.setDescription(value);
        },
        enumerable: true,
        configurable: true,
      },
      url: {
        get() {
          return embed.data.url;
        },
        set(value: string | null) {
          embed.setURL(value);
        },
        enumerable: true,
        configurable: true,
      },
      timestamp: {
        get() {
          const ts = embed.data.timestamp;
          return ts ? new Date(ts) : null;
        },
        set(value: TimestampInput) {
          embed.setTimestamp(normalizeTimestamp(value));
        },
        enumerable: true,
        configurable: true,
      },
      fields: {
        get() {
          embed.data.fields ??= [];
          return embed.data.fields;
        },
        set(value) {
          embed.setFields(value ?? []);
        },
        enumerable: true,
        configurable: true,
      },
      image: {
        get() {
          return {
            get url() {
              return embed.data.image?.url;
            },
            set url(value: string | undefined) {
              embed.setImage(value ?? null);
            },
          };
        },
        set(value: { url?: string } | null | undefined) {
          embed.setImage(value?.url ?? null);
        },
        enumerable: true,
        configurable: true,
      },
      thumbnail: {
        get() {
          return {
            get url() {
              return embed.data.thumbnail?.url;
            },
            set url(value: string | undefined) {
              embed.setThumbnail(value ?? null);
            },
          };
        },
        set(value: { url?: string } | null | undefined) {
          embed.setThumbnail(value?.url ?? null);
        },
        enumerable: true,
        configurable: true,
      },
      footer: {
        get() {
          return {
            get text() {
              return embed.data.footer?.text;
            },
            set text(value: string) {
              embed.setFooter({
                text: value,
                iconURL: embed.data.footer?.icon_url ?? defaults.icon,
              });
            },
            get iconURL() {
              return embed.data.footer?.icon_url;
            },
            set iconURL(value: string | undefined) {
              embed.setFooter({
                text: embed.data.footer?.text ?? '',
                iconURL: value ?? defaults.icon,
              });
            },
          };
        },
        set(value: { text?: string; iconURL?: string } | null | undefined) {
          if (value == null) {
            delete embed.data.footer;
            return;
          }
          embed.setFooter({
            text: value.text ?? '',
            iconURL: value.iconURL ?? defaults.icon,
          });
        },
        enumerable: true,
        configurable: true,
      },
      author: {
        get() {
          return {
            get name() {
              return embed.data.author?.name;
            },
            set name(value: string) {
              embed.setAuthor({
                name: value,
                iconURL: embed.data.author?.icon_url,
                url: embed.data.author?.url,
              });
            },
            get iconURL() {
              return embed.data.author?.icon_url;
            },
            set iconURL(value: string | undefined) {
              embed.setAuthor({
                name: embed.data.author?.name ?? '',
                iconURL: value,
                url: embed.data.author?.url,
              });
            },
            get url() {
              return embed.data.author?.url;
            },
            set url(value: string | undefined) {
              embed.setAuthor({
                name: embed.data.author?.name ?? '',
                iconURL: embed.data.author?.icon_url,
                url: value,
              });
            },
          };
        },
        set(value: { name?: string; iconURL?: string; url?: string } | null | undefined) {
          if (value == null) {
            delete embed.data.author;
            return;
          }
          embed.setAuthor({
            name: value.name ?? '',
            iconURL: value.iconURL,
            url: value.url,
          });
        },
        enumerable: true,
        configurable: true,
      },
    });
  }
}
