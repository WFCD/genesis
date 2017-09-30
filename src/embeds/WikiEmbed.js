'use strict';

const BaseEmbed = require('./BaseEmbed.js');

/**
 * Generates enemy embeds
 */
class WikiEmbed extends BaseEmbed {
  /**
   * @param {Genesis} bot - An instance of Genesis
   * @param {Array.<Attachment>} details details to derive data from
   * @param {boolean} thumbnail - whether or not to use the image as a thumbnail or image
   */
  constructor(bot, details, thumbnail) {
    super();
    const item = Object.values(details.items)[0];
    this.title = item.title;
    this.type = 'rich';
    this.url = details.basepath + item.url;

    const imgThing = {
      url: item.thumbnail ? item.thumbnail.replace(/\/revision\/.*/, '') : '_ _',
    };
    if (thumbnail) {
      this.thumbnail = imgThing;
    } else {
      this.image = imgThing;
    }
    this.description = item.abstract;
  }
}

module.exports = WikiEmbed;
