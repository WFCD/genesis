export interface Logger {
  silly(message: unknown, context?: string): void;
  debug(message: unknown, context?: string): void;
  info(message: unknown, context?: string): void;
  warn(message: unknown, context?: string): void;
  error(message: unknown, context?: string): void;
  fatal(message: unknown, context?: string): void;
  isLoggable(level: string): boolean;
}
