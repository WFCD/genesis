import { timeDeltaToString } from 'warframe-worldstate-data/utilities';

export const isActive = (/** Worldstate Data element */ data) => {
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
  } catch (e) {
    return false;
  }
};

/**
 * Formats a reward object into a string
 * @param {Reward} reward to be stringified
 * @param {boolean} [includeCredits] whether to include credits in the string
 * @returns {string}
 */
export const rewardString = (reward, includeCredits = true) => {
  if (!reward) return '';
  if (reward.asString) return reward.asString;
  const tokens = reward.items.concat(reward.countedItems.map((i) => `${i.count > 1 ? i.count : ''} ${i.type}`.trim()));

  if (reward.credits && includeCredits) {
    tokens.push(`${reward.credits}cr`);
  }

  return tokens.join(' + ');
};

export const invasionEta = (invasion) => {
  try {
    const completedRuns = invasion.count;
    const required = invasion.requiredRuns;
    const ellapsedMillis = new Date(invasion.activation).getTime() - Date.now();
    const remaining = required - completedRuns;
    const estExpiry = remaining * (ellapsedMillis / completedRuns);

    return timeDeltaToString(estExpiry);
  } catch (e) {
    return '';
  }
};

export const eta = (/** Worldstate Data element */ data) => {
  try {
    if (!isActive(data)) {
      const diff = new Date(data.activation).getTime() - Date.now();
      return timeDeltaToString(diff).replace(/-?Infinityd/gi, '\u221E');
    }
    if (data?.expiry) {
      const diff = new Date(data.expiry) - Date.now();
      return timeDeltaToString(diff).replace(/-?Infinityd/gi, '\u221E');
    }
  } catch (e) {
    console.error(e);
  }

  return '';
};
