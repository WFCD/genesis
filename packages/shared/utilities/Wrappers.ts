/**
 * Format a date into a Discord relative timestamp mention
 */
export const rTime = (date: Date | string) => {
  const value = date instanceof Date ? date : new Date(date);
  return `<t:${(value.getTime() / 1000).toFixed(0)}:R>`;
};
