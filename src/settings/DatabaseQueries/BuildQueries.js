'use strict';

const SQL = require('sql-template-strings');

const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const makeId = () => {
  const tokens = [];
  for (let i = 0; i < 8; i += 1) {
    tokens.push(possible.charAt(Math.floor(Math.random() * possible.length)));
  }
  return tokens.join('');
};

class BuildQueries {
  constructor(db) {
    this.db = db;
  }

  async addNewBuild(title, body, image, owner) {
    const buildId = makeId();
    const query = SQL`INSERT INTO builds VALUES (${buildId}, ${title}, ${body}, ${image}, ${owner.id})
      ON DUPLICATE KEY UPDATE title=${title}, body=${body}, image=${image};`;
    await this.db.query(query);
    return {
      id: buildId, title, body, url: image, owner,
    };
  }

  async getBuild(buildId) {
    if (buildId) {
      const query = SQL`SELECT * FROM builds WHERE build_id=${buildId};`;
      const res = await this.db.query(query);
      if (res[0] && res[0][0]) {
        const result = res[0][0];
        return {
          title: result.title,
          body: result.body,
          url: result.image,
          id: result.build_id,
          owner: this.bot.client.users.get(result.owner_id) || result.owner_id,
          owner_id: result.owner_id,
        };
      }
    }
    return {
      id: '',
      title: 'No Such Build',
      body: '',
      url: '',
      owner: '',
    };
  }

  async deleteBuild(buildId) {
    const query = SQL`DELETE FROM builds WHERE build_id=${buildId};`;
    return this.db.query(query);
  }

  async getBuilds(owner, author) {
    const query = SQL`SELECT * FROM builds WHERE owner_id LIKE ${owner ? '%' : author.id};`;
    const res = await this.db.query(query);
    if (res[0]) {
      return res[0].map(build => ({
        id: build.build_id,
        owner: this.bot.client.users.get(build.owner_id) || build.owner_id,
        title: build.title,
      }));
    }
    return [];
  }

  async setBuildFields(buildId, { title = undefined, body = undefined, image = undefined }) {
    const setTokens = [];
    if (title) {
      setTokens.push(`title = '${title.trim().replace(/'/ig, '\\\'')}'`);
    }
    if (body) {
      setTokens.push(`body = '${body.trim().replace(/'/ig, '\\\'')}'`);
    }
    if (image) {
      setTokens.push(`image = '${image.trim().replace(/'/ig, '\\\'')}'`);
    }
    if (setTokens.length > 0) {
      const query = `UPDATE builds SET ${setTokens.join(', ')} WHERE build_id='${buildId}';`;
      return this.db.query(query);
    }
    return false;
  }
}

module.exports = BuildQueries;
