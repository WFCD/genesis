'use strict';

const Sentry = require('@sentry/node');
require('colors');

/**
 * A collection of methods for logging
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
  DEBUG: 'cyan',
  INFO: 'blue',
  WARN: 'orange',
  ERROR: 'red',
  FATAL: 'magenta',
};
const scopes = {
  BOT: 'yellow',
  WORKER: 'green',
};

const colorify = (level, map) => level[map[level] || 'red'];
const fmt = (level, scope, msg) => `[${colorify(scope, scopes)}] ${colorify(level, levels).toLowerCase()}: ${msg}`;

Object.keys(levels).forEach((level) => {
  Logger.prototype[level.toLowerCase()] = (message) => {
    const simple = fmt(level, process.env.SCOPE || 'BOT', message);
    if ((Object.keys(levels).indexOf(level) >= Object.keys(levels)
      .indexOf(l.logLevel)) && Object.keys(levels).indexOf(level) < 3) {
      // eslint-disable-next-line no-console
      console.log(simple);
    }

    if (level.toLowerCase() === 'fatal' && Sentry) {
      Sentry.captureMessage(message, {
        level: 'fatal',
      });
      process.exit(4);
    }
    if (level.toLowerCase() === 'error') {
      // eslint-disable-next-line no-console
      console.error(simple);
      // eslint-disable-next-line no-console
      console.error(message);
      if (Sentry) {
        Sentry.captureException(message);
      }
    }
  };
});

module.exports = Logger;
