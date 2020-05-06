'use strict';

/* eslint-disable no-console */
const Sentry = require('@sentry/node');
require('colors');

Sentry.init(process.env.RAVEN_URL, { autoBreadcrumbs: true });

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

const l = {
  get logLevel() {
    return process.env.LOG_LEVEL || 'ERROR';
  },
};
const levels = {
  SILLY: 'grey',
  DEBUG: 'cyan',
  INFO: 'blue',
  WARN: 'orange',
  ERROR: 'red',
  FATAL: 'magenta',
};
const scopes = {
  BOT: 'yellow',
  WORKER: 'grey',
};

const colorify = (level, map) => level[map[level] || 'red'];
const fmt = (level, scope, msg) => `[${colorify(scope, scopes)}] ${(colorify(level, levels) || 'ukn').toLowerCase()}: ${msg}`;

Object.keys(levels).forEach((level) => {
  Logger.prototype[level.toLowerCase()] = (message) => {
    const simple = fmt(level, process.env.SCOPE || 'BOT', message);
    const isActive = Object.keys(levels).indexOf(level) >= Object.keys(levels).indexOf(l.logLevel);
    const nonError = Object.keys(levels).indexOf(level) < Object.keys(levels).indexOf('ERROR');
    if (isActive && nonError) {
      console.log(simple);
    }

    if (level.toLowerCase() === 'fatal') {
      if (Sentry) Sentry.captureMessage(message, { level: 'fatal' });
      console.error(simple);
      process.exit(4);
    }
    if (level.toLowerCase() === 'error') {
      console.error(simple);
      if (typeof message === 'object') {
        console.error(message);
      }
      if (Sentry) {
        Sentry.captureException(message);
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
