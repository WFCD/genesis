import 'server-only';

import '@/lib/env';
import type Database from '#shared/settings/Database';
import { createServices, type Services } from '#shared/services/index';

let database: Database | null = null;
let services: Services | null = null;

export async function getDatabase() {
  if (!database) {
    const { default: DatabaseClass } = await import('#shared/settings/Database');
    database = await DatabaseClass.build();
    database.init();
  }
  return database;
}

export async function getServices() {
  if (!services) {
    services = createServices(await getDatabase());
  }
  return services;
}
