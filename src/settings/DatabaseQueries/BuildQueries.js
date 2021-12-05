'use strict';

const SQL = require('sql-template-strings');

const Build = require('../../models/Build.js');
const WorldStateClient = require('../../resources/WorldStateClient');

/**
 * Database Mixin for Build queries
 * @mixin
 * @mixes Database
 */
module.exports = class BuildQueries {
  async addNewBuilds(builds) {
    const rows = [];
    builds.forEach((build) => {
      const buildId = Build.makeId();
      build.id = buildId; // eslint-disable-line no-param-reassign
      rows.push([buildId, build.title, build.body, build.image, build.ownerId, build.isPublic]);
    });

    const query = SQL`INSERT INTO builds VALUES `;
    rows.forEach((build, index) => query.append(SQL`(${build})`).append(index !== (rows.length - 1) ? ',' : ';'));

    await this.query(query);
    return builds;
  }

  async addNewBuild(title, body, image, owner) {
    const buildId = Build.makeId();
    const query = SQL`INSERT INTO builds VALUES (${buildId}, ${title}, ${body}, ${image}, ${owner.id}, '0')
      ON DUPLICATE KEY UPDATE title=${title}, body=${body}, image=${image};`;
    await this.query(query);
    return {
      id: buildId, title, body, url: image, owner,
    };
  }

  /**
   * Get a build by id
   * @param {string} buildId a build id
   * @returns {Promise<Build>}
   */
  async getBuild(buildId) {
    if (buildId) {
      const query = SQL`SELECT * FROM builds WHERE build_id=${buildId};`;
      const [rows] = await this.query(query);
      if (rows && rows[0]) {
        const result = rows[0];
        if (result.owner_id) {
          result.owner = this.bot.client.users.cache.get(result.owner_id) || result.owner_id;
        }
        return new Build(result, new WorldStateClient(require('../../Logger')));
      }
    }
    return undefined;
  }

  /**
   * Search for builds
   * @param {string} qString query string
   * @returns {Promise<SimpleBuild>}
   */
  async getBuildSearch(qString) {
    if (qString) {
      const wrapped = `%${qString}%`;
      const query = SQL`SELECT * FROM builds WHERE (title like ${wrapped} or body like ${wrapped}) and is_public = '1' ;`;
      const [rows] = await this.query(query);
      const ws = new WorldStateClient(require('../../Logger'));

      if (rows) {
        return rows.map(result => new Build(result, ws));
      }
    }
    return [];
  }

  async deleteBuild(buildId) {
    const query = SQL`DELETE FROM builds WHERE build_id=${buildId};`;
    return this.query(query);
  }

  /**
   * Returns list of builds, by owner if specified
   * @param {boolean} owner whether or not search should be limited to the requestor
   * @param {User} author requestor of builds
   * @param {Array<string>} [buildIds] ids of builds to look up
   * @returns {Promise<Array<SimpleBuild>>}
   */
  async getBuilds(owner, author, buildIds) {
    let query = '';
    if (buildIds && buildIds.length) {
      query = SQL`SELECT * FROM builds WHERE owner_id LIKE ${owner ? '%' : author.id} and build_id in (${buildIds});`;
    } else {
      query = SQL`SELECT * FROM builds WHERE owner_id LIKE ${owner ? '%' : author.id};`;
    }
    const ws = new WorldStateClient(require('../../Logger'));

    const [rows] = await this.query(query);
    if (rows) {
      return rows.map(result => new Build(result, ws));
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

  /**
   * Save a build
   * @param {Build} build to save
   * @returns {Promise<mysql.Connection.query>}
   */
  async saveBuild(build) {
    const keys = Object.keys(build).filter(k => k !== 'id');
    let query;
    const sqlize = (val) => {
      if (typeof val === 'undefined') return 'NULL';
      if (Array.isArray(val)) return `'${JSON.stringify(val)}'`;
      if (typeof val !== 'string' && !val) return 'NULL';
      return `'${val}'`;
    };
    const populate = (key, index) => {
      if (build[key]?.uniqueName) query.append(`${key} = '${build[key].uniqueName}'`);
      else query.append(`${key} = ${sqlize(build[key])}`);

      if (index < keys.length - 1) query.append(', ');
      else query.append(' ');
    };
    if (build.id) {
      if (!keys.length) {
        return this.query(`DELETE FROM builds WHERE build_id=${build.id}`);
      }
      query = SQL`UPDATE builds SET `;
      keys.forEach(populate);
      query.append(SQL` WHERE build_id=${build.id};`);
    } else { // this means it's new
      query = SQL`INSERT INTO builds SET `;
      keys.forEach(populate);
      query.append(SQL`, build_id = ${Build.makeId()};`);
    }
    return this.query(query);
  }
};
