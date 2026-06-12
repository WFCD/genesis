import SQL from 'sql-template-strings';

import Build, { type BuildData } from '#shared/models/Build';
import logger from '#shared/utilities/Logger';
import WorldStateClient from '#shared/utilities/WorldStateClient';
import type { DatabaseDeps } from '#shared/settings/database/DatabaseDeps';

type UserRef = { id: string; tag?: string };
type BuildRef = Record<string, unknown> & { id?: string };

export interface BuildRepositoryDeps extends DatabaseDeps {
  bot?: {
    client?: {
      users?: {
        cache?: {
          get(id: string): unknown;
        };
      };
    };
  };
}

/**
 * Build persistence and search for warframe build interactions.
 * Mirrors legacy `BuildQueries` mixin behavior.
 */
export default class BuildRepository {
  constructor(private readonly deps: BuildRepositoryDeps) {}

  async addNewBuilds(builds: Array<Record<string, unknown>>) {
    const rows: unknown[] = [];
    builds.forEach((build) => {
      const buildId = Build.makeId();
      build.id = buildId;
      rows.push([buildId, build.title, build.body, build.image, build.ownerId, build.isPublic]);
    });

    const query = SQL`INSERT INTO builds VALUES `;
    rows.forEach((build, index) => query.append(SQL`(${build})`).append(index !== rows.length - 1 ? ',' : ';'));

    await this.deps.query(query);
    return builds;
  }

  async addNewBuild(title: string, body: string, image: string, owner: UserRef) {
    const buildId = Build.makeId();
    const query = SQL`INSERT INTO builds VALUES (${buildId}, ${title}, ${body}, ${image}, ${owner.id}, '0')
      ON DUPLICATE KEY UPDATE title=${title}, body=${body}, image=${image};`;
    await this.deps.query(query);
    return {
      id: buildId,
      title,
      body,
      url: image,
      owner,
    };
  }

  async getBuild(buildId?: string) {
    if (buildId) {
      const query = SQL`SELECT * FROM builds WHERE build_id=${buildId};`;
      const [rows] = (await this.deps.query(query)) ?? [[]];
      if (rows && rows[0]) {
        const result = rows[0] as BuildData;
        if (result.owner_id) {
          const cached = this.deps.bot?.client?.users?.cache?.get(String(result.owner_id));
          result.owner = (cached as BuildData['owner']) || String(result.owner_id);
        }
        return new Build(result, new WorldStateClient(logger));
      }
    }
    return undefined;
  }

  async getBuildSearch(qString?: string) {
    if (qString) {
      const wrapped = `%${qString}%`;
      const query = SQL`SELECT * FROM builds WHERE (title like ${wrapped} or body like ${wrapped}) and is_public = '1' ;`;
      const [rows] = (await this.deps.query(query)) ?? [[]];
      const ws = new WorldStateClient(logger);

      if (rows) {
        return (rows as BuildData[]).map((result) => new Build(result, ws));
      }
    }
    return [];
  }

  async deleteBuild(buildId: string) {
    const query = SQL`DELETE FROM builds WHERE build_id=${buildId};`;
    return this.deps.query(query);
  }

  async getBuilds(owner: boolean, author: UserRef, buildIds?: string[]) {
    let query;
    if (buildIds && buildIds.length) {
      query = SQL`SELECT * FROM builds WHERE owner_id LIKE ${owner ? '%' : author.id} and build_id in (${buildIds});`;
    } else {
      query = SQL`SELECT * FROM builds WHERE owner_id LIKE ${owner ? '%' : author.id};`;
    }
    const ws = new WorldStateClient(logger);

    const [rows] = (await this.deps.query(query)) ?? [[]];
    if (rows) {
      return (rows as BuildData[]).map((result) => new Build(result, ws));
    }
    return [];
  }

  async setBuildFields(buildId: string, { title = undefined, body = undefined, image = undefined }) {
    const query = SQL`UPDATE builds SET `;

    if (title) {
      query.append(SQL`title = ${title.trim().replace(/'/gi, "\\'")}`);
    }
    if (body) {
      query.append(SQL`body = ${body.trim().replace(/'/gi, "\\'")}`);
    }
    if (image) {
      query.append(SQL`image = ${image.trim().replace(/'/gi, "\\'")}`);
    }

    if (title || body || image) {
      query.append(SQL` WHERE build_id=${buildId};`);
      return this.deps.query(query);
    }
    return false;
  }

  async setBuildPublicity(buildIds: string[], isPublic: string | number | boolean) {
    const query = SQL`UPDATE builds SET is_public = ${isPublic} WHERE build_id in (${buildIds})`;
    return this.deps.query(query);
  }

  async saveBuild(build: BuildRef) {
    const keys = Object.keys(build).filter((k) => k !== 'id');
    let query;
    const sqlize = (val: unknown) => {
      if (typeof val === 'undefined') return 'NULL';
      if (Array.isArray(val)) return `'${JSON.stringify(val)}'`;
      if (typeof val !== 'string' && !val) return 'NULL';
      return `'${val}'`;
    };
    const populate = (key: string, index: number) => {
      const maybeObj = build[key] as { uniqueName?: string } | undefined;
      if (maybeObj?.uniqueName) query.append(`${key} = '${maybeObj.uniqueName}'`);
      else query.append(`${key} = ${sqlize(build[key])}`);

      if (index < keys.length - 1) query.append(', ');
      else query.append(' ');
    };
    if (build.id) {
      if (!keys.length) {
        return this.deps.query(`DELETE FROM builds WHERE build_id=${build.id}`);
      }
      query = SQL`UPDATE builds SET `;
      keys.forEach(populate);
      query.append(SQL` WHERE build_id=${build.id};`);
    } else {
      query = SQL`INSERT INTO builds SET `;
      keys.forEach(populate);
      query.append(SQL`, build_id = ${Build.makeId()};`);
    }
    return this.deps.query(query);
  }
}
