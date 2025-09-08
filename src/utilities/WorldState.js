import dayjs from 'dayjs';
import { timeDeltaToString } from 'warframe-worldstate-data/utilities';

export const isActive = (/** Worldstate Data element */ data) => {
  if (data?.activation && data?.expiry) {
    return new Date(data.activation).getTime() < Date.now() && new Date(data.expiry).getTime() > Date.now();
  }
  return true;
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

export const eta = (/** Worldstate Data element */ data) => {
  if (data?.expiry) {
    const diff = dayjs(data.expiry).diff(dayjs());
    return timeDeltaToString(diff).replace(/-?Infinityd/gi, '\u221E');
  }
};
