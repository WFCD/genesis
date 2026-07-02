import { isTestMariaDbEnabled, setupTestDatabase, teardownTestDatabase } from './helpers/testDatabase';

export const mochaHooks = {
  async beforeAll(this: Mocha.Context) {
    if (!isTestMariaDbEnabled()) return;
    this.timeout(120_000);
    await setupTestDatabase();
  },
  afterAll: async () => {
    if (!isTestMariaDbEnabled()) return;
    await teardownTestDatabase();
  },
};
