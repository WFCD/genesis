import { formatFixedWidthTable } from '#shared/utilities/CommonFunctions';

import BaseEmbed from './BaseEmbed';

export type WhereisSort = 'chance' | 'item' | 'location';

export type WhereisRow = {
  item: string;
  place: string;
  rarity: string;
  chance: string;
  chanceNum: number;
};

export const WHEREIS_SORT_LABELS: Record<WhereisSort, string> = {
  chance: 'Drop %',
  item: 'Item',
  location: 'Location',
};

const SORT_SUMMARY: Record<WhereisSort, string> = {
  chance: 'sorted by drop chance (high → low)',
  item: 'sorted by item name (A → Z)',
  location: 'sorted by location (A → Z)',
};

export const abbrevWhereisItem = (name: string) => name.replace(/Blueprint/g, 'BP').replace(/ Prime/g, ' P.');

export const formatWhereisPlace = (place: string) => (place.split('/')[1] || place).trim();

export const sortWhereisRows = (results: WhereisRow[], sort: WhereisSort) => {
  const rows = [...results];
  switch (sort) {
    case 'item':
      return rows.sort((a, b) => abbrevWhereisItem(a.item).localeCompare(abbrevWhereisItem(b.item)));
    case 'location':
      return rows.sort((a, b) => formatWhereisPlace(a.place).localeCompare(formatWhereisPlace(b.place)));
    default:
      return rows.sort((a, b) => b.chanceNum - a.chanceNum);
  }
};

const buildTable = (results: Array<Pick<WhereisRow, 'item' | 'place' | 'rarity' | 'chance'>>) => {
  const items = results.map((result) => abbrevWhereisItem(result.item));
  const places = results.map((result) => formatWhereisPlace(result.place));
  const drops = results.map((result) => `${result.rarity.charAt(0)}@${result.chance}`);

  return formatFixedWidthTable([
    { header: 'Item', cells: items, maxWidth: 30, minWidth: 4 },
    { header: 'Location', cells: places, maxWidth: 42, minWidth: 8 },
    { header: 'Drop', cells: drops, minWidth: 6, align: 'right' },
  ]);
};

export default class WhereisEmbed extends BaseEmbed {
  constructor(
    results: Array<Pick<WhereisRow, 'item' | 'place' | 'rarity' | 'chance'>>,
    query: string,
    sort: WhereisSort = 'chance'
  ) {
    super();

    this.title = `Where is ${query}?`;
    this.color = 0x3498db;

    if (!results.length) {
      this.description = 'No drop locations found.';
      return;
    }

    const summary = `${results.length} location${results.length === 1 ? '' : 's'} · ${SORT_SUMMARY[sort]}`;
    this.description = `${summary}\n${buildTable(results)}`;
  }
}
