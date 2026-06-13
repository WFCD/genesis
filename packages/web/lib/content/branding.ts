import 'server-only';

import env from '@/lib/env';

export function getAppName() {
  return env.appName;
}

export function getDashboardTitle() {
  return `${getAppName()} Dashboard`;
}
