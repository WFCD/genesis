'use strict';

const rp = require('request-promise');

const DEFAULT_MULTIREDDIT = 'https://reddit.com/u/d0nkeh/m/corgi.json';
const multiUrl = process.env.CORGI_MULTIREDDIT_URL
  || process.env.MULTIREDDIT_URL || DEFAULT_MULTIREDDIT;

function listPosts(uri) {
  return rp({
    uri,
    json: true,
    headers: {
      'User-Agent': 'hubot/corgi v0.5.2 (by /u/d0nkeh)',
    },
  }).then((data) => {
    if (data.kind === 'Listing') {
      return data.data.children;
    }
    return Promise.reject(data);
  }, err => Promise.reject(err));
}

function filter(children) {
  return children.map(child => child.data)
    .filter(post => !post.is_self
        && !post.over_18 // sfw only please
        && /imgur\.com|reddituploads\.com|gyfycat\.com/i.test(post.domain));
}

function corggit() {
  return listPosts(multiUrl)
    .then(posts => filter(posts))
    .then((posts) => {
      const index = Math.floor(Math.random() * posts.length);
      return posts[index];
    });
}

corggit.filter = filter;
corggit.listPosts = listPosts;

module.exports = corggit;
