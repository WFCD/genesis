import { cdn, itemImageUrl, optimizeImage, wikiBase } from '#shared/utilities/CommonFunctions';
import { eta, invasionEta, rewardString } from '#shared/utilities/WorldState';
import logger from '#shared/utilities/Logger';

import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

const invasionThumb = cdn('img/invasion.png');

/** API slug → CDN imageName (reward.thumbnail slugs are often stale/404). */
const INVASION_REWARD_IMAGES: Record<string, string> = {
  fieldron: 'CorpusComponent.png',
  detonite: 'GrineerComponent.png',
  mutagen: 'InfestedComponent.png',
  catalyst: 'InfestedEventClanIngredient.png',
  reactor: 'GrineerSettlementReactor.png',
};

const FACTION_IMAGES: Record<string, string> = {
  Corpus: optimizeImage(cdn('img/corpus.png'), 128),
  Grineer: optimizeImage(cdn('img/grineer.png'), 128),
  Infested: itemImageUrl('InfestedComponent.png'),
};

export const resolveInvasionThumbnail = (invasion) => {
  if (!invasion) return invasionThumb;

  const hasReactorAndCatalyst = invasion.rewardTypes?.includes('reactor') && invasion.rewardTypes?.includes('catalyst');
  if (hasReactorAndCatalyst) return invasionThumb;

  for (const type of invasion.rewardTypes ?? []) {
    const imageName = INVASION_REWARD_IMAGES[type];
    if (imageName) return itemImageUrl(imageName);
  }

  for (const side of [invasion.defender, invasion.attacker]) {
    const factionKey = side?.factionKey ?? side?.faction;
    if (factionKey && FACTION_IMAGES[factionKey]) {
      return FACTION_IMAGES[factionKey];
    }
  }

  return invasionThumb;
};

const primaryReward = (invasion) =>
  invasion.vsInfestation ? invasion.defender?.reward : (invasion.attacker?.reward ?? invasion.defender?.reward);

/**
 * Generates invasion embeds
 */
export default class InvasionEmbed extends BaseEmbed {
  /**
   * @param {Array.<WorldState.Invasion>|Invasion} invasions - The invasions to be included in the embed
   * @param {string} platform - platform
   * @param {Object} i18n - internationalization template function
   * @param {string} locale locale
   */
  constructor(invasions, { i18n, locale }: EmbedBuildOptions) {
    super(locale);
    if (!Array.isArray(invasions)) invasions = [invasions];

    this.color = 0x3498db;
    this.url = `${wikiBase}Invasion`;
    let thumbSource = invasions[0];

    try {
      if (invasions.length > 1) {
        this.fields = invasions.map((i) => {
          let rewards = rewardString(i.defender?.reward);
          if (!i.vsInfestation) {
            rewards = i18n`${rewardString(i.attacker?.reward)} vs ${rewards}`;
          }
          const completion = Math.round(i.completion * 100) / 100;
          return {
            name: String(i18n`${rewards} - ${completion > 0 ? completion : 0}%`),
            value: String(i18n`${i.desc} on ${i.node} - ETA ${eta(i)}`),
          };
        });
        this.title = i18n`Worldstate - Invasions`;
        this.description = i18n`Currently in-progress invasions:`;
      } else if (invasions.length === 1) {
        const i = invasions[0];
        thumbSource = i;
        let rewards = rewardString(i.defender?.reward);
        if (!i.vsInfestation) {
          rewards = i18n`${rewardString(i.attacker?.reward)} vs ${rewards}`;
        }
        const completion = Math.round(i.completion * 100) / 100;
        this.title = i18n`${rewards} - ${completion > 0 ? completion : 0}%`;
        this.description = i.desc;
        this.fields = [{ name: String(i18n`Location`), value: String(i.node), inline: true }];
        this.footer.text = i18n`${invasionEta(i)} remaining`;
        const reward = primaryReward(i);
        if (reward?.color) this.color = reward.color;
      }
    } catch (err) {
      logger.error(err);
    }

    this.setThumbnail(resolveInvasionThumbnail(thumbSource));
  }
}
