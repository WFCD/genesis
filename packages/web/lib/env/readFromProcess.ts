export function readFromProcess(key: string, fallback?: string) {
  const value = process.env[key];
  if (value === undefined || value === '') return fallback;
  return value;
}
