import type { APIEmbedField } from 'discord.js';

import { assetBase, emojify } from '#shared/utilities/CommonFunctions';

import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

/**
 * Generates enemy embeds
 */
export default class FrameEmbed extends BaseEmbed {
  /**
   * @param {Warframe} frame - The enhancement to send info on
   * @param {Array.<Warframe>} frames - List of available warframes
   * @param {I18n} i18n internationalization template
   * @param {string} locale locality
   */
  constructor(frame, { frames = [], i18n, locale }: EmbedBuildOptions) {
    super(locale);

    this.thumbnail = {
      url: `${assetBase}/img/arcane.png`,
    };
    if (frame && typeof frame !== 'undefined') {
      this.title = frame.name;
      this.url = frame.wikiaUrl;
      this.thumbnail.url = frame.wikiaThumbnail;
      this.description = `_${frame.description}_`;
      if (frame.location) {
        this.footer = { text: i18n`Drops from: ${frame.location}` };
      }
      this.color = frame.color;
      this.fields = [
        frame.url || frame.prime_url
          ? {
              name: i18n`Profile`,
              value: i18n`[Frame Profile](${frame.url})${
                frame.prime_url ? i18n`\n[Prime Intro](${frame.prime_url})` : ''
              }`,
              inline: false,
            }
          : undefined,
        frame.passiveDescription
          ? {
              name: i18n`Passive`,
              value: `_${frame.passiveDescription}_`,
            }
          : undefined,
        {
          name: i18n`Minimum Mastery`,
          value: `${frame.masteryReq || i18n`Unranked`} ${emojify('mastery_rank')}`,
          inline: true,
        },
        {
          name: i18n`Health`,
          value: frame.health || 'N/A',
          inline: true,
        },
        {
          name: i18n`Shields`,
          value: frame.shield || 'N/A',
          inline: true,
        },
        {
          name: i18n`Armor`,
          value: frame.armor || 'N/A',
          inline: true,
        },
        {
          name: i18n`Power`,
          value: frame.power || 'N/A',
          inline: true,
        },
        {
          name: i18n`Conclave`,
          value: emojify(frame.conclave ? 'green_tick' : 'red_tick'),
          inline: true,
        },
        {
          name: i18n`Aura`,
          value: emojify(frame.aura || i18n`No Aura`),
          inline: true,
        },
        {
          name: i18n`Polarities`,
          value: emojify(
            frame.polarities && frame.polarities.length > 0 ? frame.polarities.join(' ') : i18n`No polarities`
          ),
          inline: true,
        },
        {
          // this is coming out too long, needs to be chunked
          name: i18n`Abilities`,
          value: '**=============**',
        },
      ].filter(Boolean) as APIEmbedField[];

      this.fields.push(
        ...(frame?.abilities?.map((ability) => ({ name: ability.name, value: `_${ability.description}_` })) || [])
      );
      this.fields = this.fields.filter((field) => field && field?.value?.length);
    } else {
      this.title = i18n`Available Warframes`;
      this.fields = [
        { name: '\u200B', value: (frames as Array<{ name: string }>).map((stat) => stat.name).join('\n') },
      ];
    }
  }
}
