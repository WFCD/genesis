import 'server-only';

import '@/lib/env';
import type Database from '#shared/settings/Database';
import { createServices, type Services } from '#shared/services/index';

let databasePromise: Promise<Database> | null = null;
let services: Services | null = null;

const buildDatabase = async () => {
  const { default: DatabaseClass } = await import('#shared/settings/Database');
  const database = await DatabaseClass.build();
  await database.guilds.createSchema();
  database.init();
  return database;
};

export const getDatabase = () => {
  if (!databasePromise) {
    databasePromise = buildDatabase().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
};

export const getServices = async () => {
  if (!services) {
    services = createServices(await getDatabase());
  }
  return services;
};
