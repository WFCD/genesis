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

  async addNewBuilds(builds) {
    const rows = [];
    builds.forEach((build) => {
      const buildId = makeId();
      build.id = buildId; // eslint-disable-line no-param-reassign
      rows.push([buildId, build.title, build.body, build.image, build.ownerId, build.isPublic]);
    });

    const query = SQL`INSERT INTO builds VALUES `;
    rows.forEach((build, index) => query.append(SQL`(${build})`).append(index !== (rows.length - 1) ? ',' : ';'));

    await this.db.query(query);
    return builds;
  }

  async addNewBuild(title, body, image, owner) {
    const buildId = makeId();
    const query = SQL`INSERT INTO builds VALUES (${buildId}, ${title}, ${body}, ${image}, ${owner.id}, '0')
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
          ownerId: result.owner_id,
          isPublic: result.is_public === '1',
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

  async getBuildSearch(qString) {
    if (qString) {
      const wrapped = `%${qString}%`;
      const query = SQL`SELECT * FROM builds WHERE (title like ${wrapped} or body like ${wrapped}) and is_public = '1' ;`;
      const res = await this.db.query(query);
      const builds = [];
      if (res[0]) {
        res[0].forEach((result) => {
          builds.push({
            title: result.title,
            body: result.body,
            url: result.image,
            id: result.build_id,
            owner: this.bot.client.users.get(result.owner_id) || result.owner_id,
            owner_id: result.owner_id,
            isPublic: result.is_public === '1',
          });
        });
        return builds;
      }
    }
    return [];
  }

  async deleteBuild(buildId) {
    const query = SQL`DELETE FROM builds WHERE build_id=${buildId};`;
    return this.db.query(query);
  }

  async getBuilds(owner, author, buildIds) {
    let query = '';
    if (buildIds && buildIds.length) {
      query = SQL`SELECT * FROM builds WHERE owner_id LIKE ${owner ? '%' : author.id} and build_id in (${buildIds});`;
    } else {
      query = SQL`SELECT * FROM builds WHERE owner_id LIKE ${owner ? '%' : author.id};`;
    }

    const res = await this.db.query(query);
    if (res[0]) {
      return res[0].map(build => ({
        id: build.build_id,
        owner: this.bot.client.users.get(build.owner_id) || build.owner_id,
        title: build.title,
        isPublic: build.is_public === '1',
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
      const query = SQL`UPDATE builds SET ${setTokens.join(', ')} WHERE build_id='${buildId}';`;
      return this.db.query(query);
    }
    return false;
  }

  async setBuildPublicity(buildIds, isPublic) {
    const query = SQL`UPDATE builds SET is_public = ${isPublic} WHERE build_id in (${buildIds})`;
    return this.db.query(query);
  }
}

module.exports = BuildQueries;
