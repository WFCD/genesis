import http from 'node:http';
import https from 'node:https';
import crypto from 'crypto';
import logger from './Logger.js';

const retryCodes = [429].concat(
  (process.env.JSON_CACHE_RETRY_CODES || '').split(',').map((code) => parseInt(code.trim(), 10))
);
const redirectCodes = [302, 301].concat(
  (process.env.JSON_CACHE_REDIRECT_CODES || '').split(',').map((code) => parseInt(code.trim(), 10))
);

// eslint-disable-next-line no-unused-vars
const hash = (input) => {
  return crypto.createHash('md5').update(input).digest('hex');
};

const fetch = (url, { maxRetry = 10, headers } = { maxRetry: 10, headers: {} }) => {
  const protocol = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const request = protocol.get(url, { headers }, (response) => {
      const body = [];

      if (response.statusCode < 200 || response.statusCode > 299) {
        if (redirectCodes.includes(response.statusCode)) {
          setTimeout(() => {
            fetch(response.headers.location, { maxRetry, headers })
              .then((d) => resolve(d))
              .catch(logger.error);
          }, 1000);
        } else if ((response.statusCode > 499 || retryCodes.includes(response.statusCode)) && maxRetry > 0) {
          maxRetry -= 1;
          setTimeout(() => {
            fetch(url, { maxRetry, headers })
              .then((d) => resolve(d))
              .catch(logger.error);
          }, 1000);
        } else {
          logger.error(`${response.statusCode}: Failed to load ${url}`);
          resolve({});
        }
      } else {
        response.on('data', (chunk) => body.push(chunk));
        response.on('end', () => {
          const d = body.join('');
          resolve(JSON.parse(d));
        });
      }
    });
    request.on('error', (err) => {
      const e = new Error(`${err.statusCode}: ${url}\n${err.message}`);
      reject(e);
    });
  });
};

export default fetch;
