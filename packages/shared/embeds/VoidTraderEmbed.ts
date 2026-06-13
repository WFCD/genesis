import type { APIEmbedField } from 'discord.js';
import n from 'numeral';

import { assetBase, emojify } from '#shared/utilities/CommonFunctions';
import { isActive, timeToEnd, timeUntil } from '#shared/utilities/WorldState';

import BaseEmbed from './BaseEmbed';
import type { EmbedBuildOptions } from './embedOptions';

const baroThumb = `${assetBase}/img/baro.png`;

const trimField = (text: string, max: number) => (text.length <= max ? text : `${text.slice(0, max - 3)}...`);

const baroItemField = (
  item: { item?: string; ducats?: number; credits?: number },
  onDemand?: boolean
): APIEmbedField => {
  const ducats = Number(item.ducats) || 0;
  const credits = Number(item.credits) || 0;
  const d = `${n(ducats).format('0a')}${onDemand ? emojify('ducats') : 'ducats'}`;
  const cr = `${n(credits).format('0a')}${onDemand ? emojify('credits') : '*cr*'}`;
  return {
    name: trimField(String(item.item ?? 'Unknown'), 256),
    value: trimField(`${d} + ${cr}`, 1024),
    inline: true,
  };
};

export default class VoidTraderEmbed extends BaseEmbed {
  constructor(voidTrader, { platform, onDemand, i18n, locale }: EmbedBuildOptions) {
    super(locale);

    const active = isActive(voidTrader);
    const endString = timeToEnd(voidTrader);
    const startString = timeUntil(voidTrader);
    this.color = active ? 0x0ec9ff : 0xff6961;

    const inventoryFields =
      active && voidTrader?.inventory?.length > 0
        ? voidTrader.inventory.map((item) => baroItemField(item, onDemand))
        : [];

    const timeName = i18n`Time until ${active ? i18n`departure from` : i18n`arrival at`} ${voidTrader.location ?? ''}`;
    const timeField: APIEmbedField = {
      name: trimField(String(timeName), 256),
      value: trimField(String((active ? endString : startString) || i18n`Data Pending`), 1024),
    };

    // setFields() rejects >25 fields; /baro paginates in Worldstate before send.
    this.data.fields = [...inventoryFields, timeField];

    this.title = i18n`[${platform.toUpperCase()}] Worldstate - Void Trader`;
    this.thumbnail = {
      url: baroThumb,
    };
  }
}
