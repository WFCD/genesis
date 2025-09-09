import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime.js';
import updateLocale from 'dayjs/plugin/updateLocale.js';
import { timeDeltaToString } from 'warframe-worldstate-data/utilities';

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

export const isActive = (/** Worldstate Data element */ data) => {
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
  const completedRuns = invasion.count;
  const required = invasion.requiredRuns;
  const ellapsedMillis = dayjs(invasion.activation).diff(dayjs(), 'millisecond');
  const remaining = required - completedRuns;
  const estExpiry = dayjs().add(remaining * (ellapsedMillis / completedRuns), 'millisecond');

  return dayjs(estExpiry).fromNow(true).trim();
};

export const eta = (/** Worldstate Data element */ data) => {
  if (data?.expiry) {
    const diff = dayjs(data.expiry).diff(dayjs());
    return timeDeltaToString(diff).replace(/-?Infinityd/gi, '\u221E');
  }
  return '';
};
