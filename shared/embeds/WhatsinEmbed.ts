import { formatFixedWidthTable } from '#shared/utilities/CommonFunctions';

import BaseEmbed from './BaseEmbed';

const REFINEMENTS = ['Intact', 'Exceptional', 'Flawless', 'Radiant'] as const;

type Refinement = (typeof REFINEMENTS)[number];

type RelicReward = {
  itemName: string;
  chance: number;
};

type RelicDetails = {
  rewards?: Partial<Record<Refinement, RelicReward[]>>;
};

export type WhatsinRow = {
  item: string;
  chances: Partial<Record<Refinement, number>>;
};

const REFINEMENT_HEADERS: Record<Refinement, string> = {
  Intact: 'Int',
  Exceptional: 'Exc',
  Flawless: 'Flw',
  Radiant: 'Rad',
};

const abbrevItem = (name: string) => name.replace(/Blueprint/g, 'BP').replace(/ Prime/g, ' P.');

const formatChance = (chance: number | undefined) => (chance === undefined ? '—' : `${chance.toFixed(2)}%`);

export const parseWhatsinRows = (details: RelicDetails): WhatsinRow[] => {
  const byItem = new Map<string, WhatsinRow>();

  for (const refinement of REFINEMENTS) {
    for (const reward of details.rewards?.[refinement] ?? []) {
      let row = byItem.get(reward.itemName);
      if (!row) {
        row = { item: reward.itemName, chances: {} };
        byItem.set(reward.itemName, row);
      }
      row.chances[refinement] = reward.chance;
    }
  }

  return [...byItem.values()];
};

const buildTable = (rows: WhatsinRow[]) => {
  const items = rows.map((row) => abbrevItem(row.item));
  const chances = REFINEMENTS.map((refinement) => rows.map((row) => formatChance(row.chances[refinement])));

  return formatFixedWidthTable([
    { header: 'Item', cells: items, maxWidth: 34, minWidth: 4 },
    ...REFINEMENTS.map((refinement, index) => ({
      header: REFINEMENT_HEADERS[refinement],
      cells: chances[index],
      minWidth: 6,
      align: 'right' as const,
    })),
  ]);
};

export default class WhatsinEmbed extends BaseEmbed {
  constructor(details: RelicDetails, tier: string, type: string) {
    super();

    const rows = parseWhatsinRows(details);

    this.title = `${tier} ${type}`;
    this.color = 0x3498db;

    if (!rows.length) {
      this.description = 'No rewards found.';
      return;
    }

    const summary = `${rows.length} reward${rows.length === 1 ? '' : 's'} · drop % by refinement (Intact → Radiant)`;
    this.description = `${summary}\n${buildTable(rows)}`;
  }
}
