/* eslint-disable no-console */
import Sentry from '@sentry/node';

import { WebhookClient } from 'discord.js';
import ErrorEmbed from '../embeds/ErrorEmbed.js';
import 'colors';

const ignore = [
  'Invalid refresh token',
  'Failed to load',
  'https://discord.com/api/webhooks/',
  'Could not find the channel',
  'DiscordAPIError',
  'CHANNEL_NOT_CACHED',
];
const ignoreReg = new RegExp(`(${ignore.join('|')})`, 'i');

Sentry.init({
  dsn: process.env.RAVEN_URL,
  autoBreadcrumbs: true,
  beforeSend: (event, hint) => {
    const error = hint.originalException;
    if (error?.message?.match(ignoreReg)) {
      return undefined;
    }
    if (!error) {
      return event;
    }
  },
});
const scope = (process.env.SCOPE || 'worker').toUpperCase();
let errorHook;
if (process.env.CONTROL_WH_ID) {
  errorHook = new WebhookClient({
    id: process.env.CONTROL_WH_ID,
    token: process.env.CONTROL_WH_TOKEN,
  });
}

const l = {
  get logLevel() {
    return process.env.LOG_LEVEL || 'ERROR';
  },
};
const levels = {
  SILLY: 'grey',
  DEBUG: 'brightYellow',
  INFO: 'blue',
  WARN: 'brightRed',
  ERROR: 'red',
  FATAL: 'magenta',
};
const scopes = {
  BOT: 'yellow',
  WORKER: 'grey',
};
const contexts = {
  RSS: 'grey',
  Twitch: 'magenta',
  WS: 'cyan',
  DB: 'blue',
  TwitchApi: 'magenta',
  TM: 'yellow',
};

/**
 * A collection of methods for logging
 * @property {function} silly   - silly level of debugging
 * @property {function} debug   - Logs a debug message
 * @property {function} info    - Logs an info message
 * @property {function} warn - Logs a warning message
 * @property {function} error   - Logs an error message
 * @property {function} fatal   - Logs a fatal message. The program should terminate after such
 *                                 an error
 */
class Logger {}

const colorify = (level, map) => level[map[level] || 'red'];
const fmt = (level, msg, context) =>
  `[${colorify(scope, scopes)}] ${(colorify(level, levels) || 'ukn').toLowerCase()}: ${
    context ? `${colorify(context, contexts) || 'ukn'} ` : ''
  }${msg}`;

Logger.prototype.isLoggable = (level) =>
  Object.keys(levels).indexOf(level.toUpperCase()) >= Object.keys(levels).indexOf(l.logLevel);

Object.keys(levels).forEach((level) => {
  Logger.prototype[level.toLowerCase()] = (message, context) => {
    if (!message || !Logger.prototype.isLoggable(level)) return;
    const simple = fmt(level, message, context);
    const nonError = Object.keys(levels).indexOf(level) < Object.keys(levels).indexOf('ERROR');
    if (Logger.prototype.isLoggable(level) && nonError) {
      console.log(simple);
    }

    if (level.toLowerCase() === 'fatal') {
      if (Sentry) Sentry.captureMessage(message, { level: Sentry.Severity.Fatal });
      console.error(simple);
      process.exit(4);
    }
    if (level.toLowerCase() === 'error') {
      if (Sentry) {
        Sentry.captureException(message);
      }
      if (errorHook && l.logLevel !== 'DEBUG') {
        // filter out api errors, they're largely unhelpful and unrecoverable
        if (message.stack && message.stack.startsWith('DiscordAPIError')) return;
        errorHook.send({ embeds: [new ErrorEmbed(message)] }).catch(() => console.error(simple));
      } else {
        console.error(simple);
        console.error(message);
      }
    }
  };
});

const logger = new Logger();

process.on('uncaughtException', (err) => {
  logger.error(err);
});
process.on('unhandledRejection', (err) => {
  logger.error(err);
});

export default logger;
