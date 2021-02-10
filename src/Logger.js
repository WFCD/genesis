'use strict';

/* eslint-disable no-console */
const Sentry = require('@sentry/node');
require('colors');

Sentry.init(process.env.RAVEN_URL, { autoBreadcrumbs: true });

const { WebhookClient } = require('discord.js');

const scope = (process.env.SCOPE || 'worker').toUpperCase();

const ErrorEmbed = require('./embeds/ErrorEmbed');

let errorHook;
if (process.env.CONTROL_WH_ID) {
  errorHook = new WebhookClient(process.env.CONTROL_WH_ID, process.env.CONTROL_WH_TOKEN);
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
  WARN: 'orange',
  ERROR: 'red',
  FATAL: 'magenta',
};
const scopes = {
  BOT: 'yellow',
  WORKER: 'grey',
};

/**
 * A collection of methods for logging
 * @property {function} silly   - silly level of debugging
 * @property {function} debug   - Logs a debug message
 * @property {function} info    - Logs an info message
 * @property {function} warning - Logs a warning message
 * @property {function} error   - Logs an error message
 * @property {function} fatal   - Logs a fatal message. The program should terminate after such
 *                                 an error
 */
class Logger {}

const colorify = (level, map) => level[map[level] || 'red'];
const fmt = (level, msg) => `[${colorify(scope, scopes)}] ${(colorify(level, levels) || 'ukn').toLowerCase()}: ${msg}`;

Logger.prototype.isLoggable = level => Object.keys(levels)
  .indexOf(level.toUpperCase()) >= Object.keys(levels).indexOf(l.logLevel);

Object.keys(levels).forEach((level) => {
  Logger.prototype[level.toLowerCase()] = (message) => {
    const simple = fmt(level, message);
    const nonError = Object.keys(levels).indexOf(level) < Object.keys(levels).indexOf('ERROR');
    if (Logger.prototype.isLoggable(level) && nonError) {
      console.log(simple);
    }

    if (level.toLowerCase() === 'fatal') {
      if (Sentry) Sentry.captureMessage(message, { level: 'fatal' });
      console.error(simple);
      process.exit(4);
    }
    if (level.toLowerCase() === 'error') {
      if (Sentry) {
        Sentry.captureException(message);
      }
      if (errorHook) {
        // filter out api errors, they're largely unhelpful and unrecoverable
        if (message.stack && message.stack.startsWith('DiscordAPIError')) return;
        errorHook.send(new ErrorEmbed(message));
      } else {
        console.error(simple);
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

module.exports = logger;
