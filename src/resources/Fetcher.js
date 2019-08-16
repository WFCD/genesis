'use strict';

const http = require('http');
const https = require('https');
const Logger = require('../Logger');

const logger = new Logger();

const retryCodes = [429].concat((process.env.JSON_CACHE_RETRY_CODES || '').split(',').map(code => parseInt(code.trim(), 10)));

const fetch = (url, { promiseLib = Promise, maxRetry = 10, headers } =
{ promiseLib: Promise, maxRetry: 10, headers: {} }) => {
  const protocol = url.startsWith('https') ? https : http;
  // eslint-disable-next-line new-cap
  return new Promise((resolve) => {
    const request = protocol.get(url, { headers }, (response) => {
      const body = [];

      if (response.statusCode < 200 || response.statusCode > 299) {
        if ((response.statusCode > 499 || retryCodes.indexOf(response.statusCode) > -1)
          && maxRetry > 0) {
          maxRetry -= 1; // eslint-disable-line no-param-reassign
          setTimeout(() => {
            fetch(url, promiseLib, maxRetry)
              .then(resolve)
              .catch(logger.error);
          }, 1000);
        } else {
          logger.error(`${response.statusCode}: Failed to load ${url}`);
          resolve({});
        }
      } else {
        response.on('data', chunk => body.push(chunk));
        response.on('end', () => {
	  try {
            resolve(JSON.parse(body.join('')));
          } catch (e) {
           logger.error(`failed to parse ${url}`);
          }
        });
      }
    });
    request.on('error', (err) => {
      logger.error(`${err.statusCode}: ${url}\n${err.message}`);
      resolve({});
    });
  });
};

module.exports = fetch;
