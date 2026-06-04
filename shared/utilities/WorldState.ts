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
