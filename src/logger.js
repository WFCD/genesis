'use strict';

/**
 * A collection of strings that are used by the parser to produce markdown-formatted text
 * @typedef {Object.<function>} Logger
 * @property {function} debug   - Logs a debug message
 * @property {function} info    - Logs an info message
 * @property {function} warning - Logs a warning message
 * @property {function} error   - Logs an error message
 * @property {function} fatal   - Logs a fatal message. The program should terminate after such
                                  an error
 */

const levels = [
  'DEBUG',
  'INFO',
  'WARNING',
  'ERROR',
  'FATAL',
];

levels.forEach((level) => {
  module.exports[level.toLowerCase()] = (message) => {
    // eslint-disable-next-line no-console
    console.log(`[${level}] ${message}`);
  };
});
