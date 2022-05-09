/**
 * Format a date into a Discord relative timestamp mention
 * @param {Date|string} date date to format to a relative ts
 * @returns {string}
 */
// eslint-disable-next-line import/prefer-default-export
export const rTime = (date) => {
  if (!(date instanceof Date)) date = new Date(date);
  return `<t:${(date.getTime() / 1000).toFixed(0)}:R>`;
};
