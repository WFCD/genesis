import { assetBase } from '#shared/utilities/CommonFunctions';
import { eta, isActiveArbitration, parseArbitrationExpiry } from '#shared/utilities/WorldState';

import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

const arbiThumb = `${assetBase}/img/arbitrations.png`;

export default class ArbitrationEmbed extends BaseEmbed {
  /**
   * Create an embed from an array, or single, arbitration
   * @param {WorldState.Arbitration} arbitration arbitration to be displayed
   * @param {string} platform platform of the worldstate
   * @param {I18n} i18n translator
   * @param {string} locale locale of the worldstate
   */
  constructor(arbitration, { platform, i18n, locale }: EmbedBuildOptions) {
    super(locale);
    this.thumbnail.url = arbiThumb;
    this.color = 0x742725;
    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Arbitration`;

    const mission = [arbitration.enemy, arbitration.type].filter(Boolean).join(' • ') || arbitration.type || '???';
    const expiryMs = parseArbitrationExpiry(arbitration.expiry);
    const remaining = expiryMs != null ? eta({ expiry: new Date(expiryMs).toISOString() }) : eta(arbitration);

    this.fields.push({
      name: arbitration.node || '???',
      value: remaining ? `${mission}\n${i18n`Expires in ${remaining}`}` : mission,
    });

    if (expiryMs != null) {
      this.footer.text = i18n`Expires`;
      this.timestamp = expiryMs;
    } else if (isActiveArbitration(arbitration)) {
      this.footer.text = i18n`Active`;
    }
  }
}
