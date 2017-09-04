'use strict';

const http = require('http');
const https = require('https');

const retryCodes = [429].concat((process.env.JSON_CACHE_RETRY_CODES || '').split(',').map(code => parseInt(code.trim(), 10)));

class Fetcher {
  constructor(url, promiseLib = Promise, maxRetry = 10) {
    this.url = url;
    this.maxRetry = maxRetry;
    this.protocol = this.url.startsWith('https') ? https : http;
    this.retryCount = 0;
    this.Promise = promiseLib;
  }

  async httpGet() {
    return new this.Promise((resolve) => {
      const request = this.protocol.get(this.url, (response) => {
        const body = [];

        if (response.statusCode < 200 || response.statusCode > 299) {
          if ((response.statusCode > 499 || retryCodes.indexOf(response.statusCode) > -1)
            && this.retryCount < 30) {
            this.retryCount += 1;
            // eslint-disable-next-line no-console
            setTimeout(() => this.httpGet().then(resolve).catch(console.error), 1000);
          } else {
            // eslint-disable-next-line no-console
            console.error(`${response.statusCode}: Failed to load ${this.url}`);
            resolve({});
          }
        } else {
          response.on('data', chunk => body.push(chunk));
          response.on('end', () => {
            this.retryCount = 0;
            resolve(JSON.parse(body.join('')));
          });
        }
      });
      request.on('error', (err) => {
        // eslint-disable-next-line no-console
        console.error(`${err.statusCode}: ${this.url}\n${err.message}`);
        resolve({});
      });
    });
  }
}

module.exports = Fetcher;
