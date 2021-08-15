'use strict';

const SQL = require('sql-template-strings');

const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const makeId = (len = 8) => {
  const tokens = [];
  for (let i = 0; i < len; i += 1) {
    tokens.push(possible.charAt(Math.floor(Math.random() * possible.length)));
  }
  return tokens.join('');
};

/**
 * Database Mixin for Build queries
 * @mixin
 */
class BuildQueries {
  async addNewBuilds(builds) {
    const rows = [];
    builds.forEach((build) => {
      const buildId = makeId();
      build.id = buildId; // eslint-disable-line no-param-reassign
      rows.push([buildId, build.title, build.body, build.image, build.ownerId, build.isPublic]);
    });

    const query = SQL`INSERT INTO builds VALUES `;
    rows.forEach((build, index) => query.append(SQL`(${build})`).append(index !== (rows.length - 1) ? ',' : ';'));

    await this.query(query);
    return builds;
  }

  async addNewBuild(title, body, image, owner) {
    const buildId = makeId();
    const query = SQL`INSERT INTO builds VALUES (${buildId}, ${title}, ${body}, ${image}, ${owner.id}, '0')
      ON DUPLICATE KEY UPDATE title=${title}, body=${body}, image=${image};`;
    await this.query(query);
    return {
      id: buildId, title, body, url: image, owner,
    };
  }

  async getBuild(buildId) {
    if (buildId) {
      const query = SQL`SELECT * FROM builds WHERE build_id=${buildId};`;
      const [rows] = await this.query(query);
      if (rows && rows[0]) {
        const result = rows[0];
        return {
          title: result.title,
          body: result.body,
          url: result.image,
          id: result.build_id,
          owner: this.bot.client.users.cache.get(result.owner_id) || result.owner_id,
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
      const [rows] = await this.query(query);
      if (rows) {
        return rows.map(result => ({
          title: result.title,
          body: result.body,
          url: result.image,
          id: result.build_id,
          owner: this.bot.client.users.cache.get(result.owner_id) || result.owner_id,
          owner_id: result.owner_id,
          isPublic: result.is_public === '1',
        }));
      }
    }
    return [];
  }

  async deleteBuild(buildId) {
    const query = SQL`DELETE FROM builds WHERE build_id=${buildId};`;
    return this.query(query);
  }

  async getBuilds(owner, author, buildIds) {
    let query = '';
    if (buildIds && buildIds.length) {
      query = SQL`SELECT * FROM builds WHERE owner_id LIKE ${owner ? '%' : author.id} and build_id in (${buildIds});`;
    } else {
      query = SQL`SELECT * FROM builds WHERE owner_id LIKE ${owner ? '%' : author.id};`;
    }

    const [rows] = await this.query(query);
    if (rows) {
      return rows.map(build => ({
        id: build.build_id,
        owner: this.bot.client.users.cache.get(build.owner_id) || build.owner_id,
        title: build.title,
        isPublic: build.is_public === '1',
      }));
    }
    return [];
  }

  async setBuildFields(buildId, { title = undefined, body = undefined, image = undefined }) {
    const query = SQL`UPDATE builds SET `;

    if (title) {
      query.append(SQL`title = ${title.trim().replace(/'/ig, '\\\'')}`);
    }
    if (body) {
      query.append(SQL`body = ${body.trim().replace(/'/ig, '\\\'')}`);
    }
    if (image) {
      query.append(SQL`image = ${image.trim().replace(/'/ig, '\\\'')}`);
    }

    if (title || body || image) {
      query.append(SQL` WHERE build_id=${buildId};`);
      return this.query(query);
    }
    return false;
  }

  async setBuildPublicity(buildIds, isPublic) {
    const query = SQL`UPDATE builds SET is_public = ${isPublic} WHERE build_id in (${buildIds})`;
    return this.query(query);
  }
}

module.exports = BuildQueries;
