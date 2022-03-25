import SQL from 'sql-template-strings';

export default [
  /**
   * Add advanced
   * @param {Database} db database to add to
   * @returns {Promise<void>}
   */
  async (db) => {
    const currentColumns = SQL`SHOW COLUMNS from builds;`;
    const [results] = await db.query(currentColumns);
    const columns = results.map(result => result.Field);
    if (!columns.includes('warframe')) {
      await db.query(SQL`ALTER TABLE builds
        ADD COLUMN (
          warframe TEXT DEFAULT NULL,
          primus TEXT DEFAULT NULL,
          secondary TEXT DEFAULT NULL,
          melee TEXT DEFAULT NULL,
          archwing TEXT DEFAULT NULL,
          archgun TEXT DEFAULT NULL,
          archmelee TEXT DEFAULT NULL,
          focus TEXT DEFAULT NULL,
          prism TEXT DEFAULT NULL,
          necramech TEXT DEFAULT NULL,
          necramelee TEXT DEFAULT NULL,
          necragun TEXT DEFAULT NULL,
          mods  TEXT DEFAULT NULL,
          heavy TEXT DEFAULT NULL
        );`);
    }
  },
];
