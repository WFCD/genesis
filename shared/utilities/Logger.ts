import Sentry from '@sentry/node';
import chalk from 'chalk';
import { WebhookClient } from 'discord.js';

import ErrorEmbed from '#shared/embeds/ErrorEmbed';
import type { Logger } from '#shared/types/logger';

const ignore = [
  'Invalid refresh token',
  'Failed to load',
  'https://discord.com/api/webhooks/',
  'Could not find the channel',
  'DiscordAPIError',
  'CHANNEL_NOT_CACHED',
];
const ignoreReg = new RegExp(`(${ignore.join('|')})`, 'i');
const isTestEnv = process.env.NODE_ENV === 'test';

if (!isTestEnv) {
  Sentry.init({
    dsn: process.env.RAVEN_URL,
    beforeSend: (event, hint) => {
      const error = hint.originalException;
      if (error instanceof Error && error.message.match(ignoreReg)) {
        return undefined;
      }
      if (!error) {
        return event;
      }
      return event;
    },
  });
}

const scope = (process.env.SCOPE || 'worker').toUpperCase();
let errorHook: WebhookClient | undefined;
if (!isTestEnv && process.env.CONTROL_WH_ID) {
  errorHook = new WebhookClient({
    id: process.env.CONTROL_WH_ID,
    token: process.env.CONTROL_WH_TOKEN ?? '',
  });
}

const logConfig = {
  get logLevel() {
    return (process.env.LOG_LEVEL || 'ERROR').toUpperCase();
  },
};

const levels = {
  SILLY: 'black',
  DEBUG: 'green',
  INFO: 'gray',
  WARN: 'yellow',
  ERROR: 'red',
  FATAL: 'red',
} as const;

const scopes = {
  BOT: 'yellow',
  WORKER: 'gray',
};

const contexts = {
  RSS: 'gray',
  Twitch: 'magenta',
  WS: 'cyan',
  DB: 'blue',
  TwitchApi: 'magenta',
  TM: 'yellow',
};

const chalkColors: Record<string, (text: string) => string> = {
  gray: chalk.gray,
  grey: chalk.gray,
  green: chalk.green,
  yellow: chalk.yellow,
  red: chalk.red,
  black: chalk.black,
  magenta: chalk.magenta,
  cyan: chalk.cyan,
  blue: chalk.blue,
};

const paint = (text: string, colorName: string) => (chalkColors[colorName] ?? chalk.white)(text);

const formatMessage = (message: unknown) => {
  if (message instanceof Error) return message.message;
  if (typeof message === 'string') return message;
  if (typeof message === 'undefined' || message === null) return String(message);
  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
};

const fmt = (level: keyof typeof levels, message: unknown, context?: string) => {
  const levelColor = levels[level];
  const scopeColor = scopes[scope as keyof typeof scopes] ?? 'gray';
  const contextColor = context ? (contexts[context as keyof typeof contexts] ?? 'gray') : undefined;
  const levelLabel = paint(level.toLowerCase(), levelColor);
  const body = paint(formatMessage(message), levelColor);

  return `[${paint(scope, scopeColor)}] ${levelLabel}:${context ? ` ${paint(context, contextColor!)}` : ''} ${body}`;
};

function toError(message: unknown): Error {
  return message instanceof Error ? message : new Error(String(message));
}

class LoggerClass implements Logger {
  isLoggable(level: string): boolean {
    return Object.keys(levels).indexOf(level.toUpperCase()) >= Object.keys(levels).indexOf(logConfig.logLevel);
  }

  silly(message: unknown, context?: string): void {
    this.log('SILLY', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.log('DEBUG', message, context);
  }

  info(message: unknown, context?: string): void {
    this.log('INFO', message, context);
  }

  warn(message: unknown, context?: string): void {
    this.log('WARN', message, context);
  }

  error(message: unknown, context?: string): void {
    this.log('ERROR', message, context);
  }

  fatal(message: unknown, context?: string): void {
    this.log('FATAL', message, context);
  }

  log(level: keyof typeof levels, message: unknown, context?: string): void {
    if (!message || !this.isLoggable(level)) return;
    const simple = fmt(level, message, context);
    const nonError = Object.keys(levels).indexOf(level) < Object.keys(levels).indexOf('ERROR');
    if (this.isLoggable(level) && nonError) {
      console.log(simple);
    }

    if (level === 'FATAL') {
      if (!isTestEnv) {
        Sentry.captureMessage(String(message), 'fatal');
      }
      console.error(simple);
      if (!isTestEnv) {
        process.exit(4);
      }
      return;
    }
    if (level === 'ERROR') {
      if (!isTestEnv) {
        Sentry.captureException(message);
      }
      console.error(simple);
      if (message instanceof Error && message.stack) {
        console.error(paint(message.stack, levels.ERROR));
      } else if (!(message instanceof Error)) {
        console.error(paint(formatMessage(message), levels.ERROR));
      }

      if (errorHook && logConfig.logLevel !== 'DEBUG') {
        const error = toError(message);
        errorHook.send({ embeds: [new ErrorEmbed(error)] }).catch((hookErr) => {
          console.error('Failed to send error webhook:', hookErr);
        });
      }
    }
  }
}

const logger = new LoggerClass();

process.on('uncaughtException', (err) => {
  logger.error(err);
});
process.on('unhandledRejection', (err) => {
  logger.error(err);
});

export default logger;
