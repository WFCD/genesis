import { timeDeltaToString } from 'warframe-worldstate-data/utilities';

import logger from '#shared/utilities/Logger';

type TimedData = {
  activation?: string;
  expiry?: string;
};

type Reward = {
  asString?: string;
  items?: string[];
  countedItems?: Array<{ count: number; type: string }>;
  credits?: number;
};

type Invasion = {
  count: number;
  requiredRuns: number;
  activation: string;
};

export const isActive = (data: TimedData) => {
  try {
    if (data?.activation && data?.expiry) {
      return new Date(data.activation).getTime() < Date.now() && new Date(data.expiry).getTime() > Date.now();
    }
    if (data?.activation) {
      return new Date(data.activation).getTime() < Date.now();
    }
    if (data?.expiry) {
      return new Date(data.expiry).getTime() > Date.now();
    }
    return true;
  } catch {
    return false;
  }
};

export const isExpired = (data: TimedData) => {
  try {
    if (data?.expiry) {
      return new Date(data.expiry).getTime() < Date.now();
    }
    return false;
  } catch {
    return false;
  }
};

/** Discord rejects embed timestamps after ~275760; API uses that as an inactive placeholder. */
const DISCORD_MAX_TIMESTAMP_MS = Date.parse('275760-09-12T00:00:00.000Z');

export type ArbitrationData = {
  expired?: boolean;
  node?: string;
  nodeKey?: string;
  type?: string;
  typeKey?: string;
  enemy?: string;
  expiry?: string | number;
};

/** True when worldstate has a live arbitration (not the SolNode000 placeholder). */
export const isActiveArbitration = (arbitration: ArbitrationData | null | undefined) => {
  if (!arbitration || typeof arbitration !== 'object') return false;
  if (arbitration.expired === true) return false;
  if (arbitration.nodeKey === 'SolNode000' || arbitration.node === 'SolNode000') return false;
  if (arbitration.type === 'Unknown' || arbitration.typeKey === 'Unknown') return false;
  return Boolean(arbitration.node || arbitration.type);
};

export const parseArbitrationExpiry = (expiry: unknown): number | null => {
  if (expiry == null) return null;

  if (typeof expiry === 'number') {
    if (!Number.isFinite(expiry) || expiry <= 0) return null;
    const ms = expiry < 1e12 ? expiry * 1000 : expiry;
    return ms > DISCORD_MAX_TIMESTAMP_MS ? null : ms;
  }

  if (typeof expiry === 'string') {
    if (/^\+|275760/.test(expiry)) return null;
    const ms = Date.parse(expiry);
    if (Number.isNaN(ms) || ms > DISCORD_MAX_TIMESTAMP_MS) return null;
    return ms;
  }

  return null;
};

export const rewardString = (reward: Reward | undefined, includeCredits = true) => {
  if (!reward) return '';
  if (reward.asString) return reward.asString;
  const tokens = (reward.items ?? []).concat(
    (reward.countedItems ?? []).map((i) => `${i.count > 1 ? i.count : ''} ${i.type}`.trim())
  );

  if (reward.credits && includeCredits) {
    tokens.push(`${reward.credits}cr`);
  }

  return tokens.join(' + ');
};

export const invasionEta = (invasion: Invasion) => {
  try {
    const completedRuns = invasion.count;
    const required = invasion.requiredRuns;
    const ellapsedMillis = new Date(invasion.activation).getTime() - Date.now();
    const remaining = required - completedRuns;
    const estExpiry = remaining * (ellapsedMillis / completedRuns);

    return timeDeltaToString(estExpiry);
  } catch {
    return '';
  }
};

export const eta = (data: TimedData) => {
  try {
    if (!isActive(data)) {
      const diff = new Date(data.activation!).getTime() - Date.now();
      return timeDeltaToString(diff).replace(/-?Infinityd/gi, '\u221E');
    }
    if (data?.expiry) {
      const diff = new Date(data.expiry).getTime() - Date.now();
      return timeDeltaToString(diff).replace(/-?Infinityd/gi, '\u221E');
    }
  } catch (e) {
    logger.error(e);
  }

  return '';
};

export const timeUntil = (data: TimedData) => {
  try {
    if (data?.activation) {
      const diff = new Date(data.activation).getTime() - Date.now();
      return timeDeltaToString(diff).replace(/-?Infinityd/gi, '\u221E');
    }
  } catch (e) {
    logger.error(e);
  }
  return '';
};

export const timeToEnd = (data: TimedData) => {
  try {
    if (data?.expiry) {
      const diff = new Date(data.expiry).getTime() - Date.now();
      return timeDeltaToString(diff).replace(/-?Infinityd/gi, '\u221E');
    }
  } catch (e) {
    logger.error(e);
  }
  return '';
};
