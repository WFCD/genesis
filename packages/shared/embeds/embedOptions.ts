/** Shared optional context passed into embed constructors from commands/worker. */
export type EmbedBuildOptions = Record<string, unknown> & {
  i18n?: (...args: unknown[]) => string;
  locale?: string;
  platform?: string;
  era?: string;
  skipCheck?: boolean;
  syndicate?: string;
  onDemand?: boolean;
  isCommand?: boolean;
  type?: string;
  category?: string;
  enhancements?: unknown;
  frames?: unknown[];
  tokens?: unknown;
  resultKey?: unknown;
};
