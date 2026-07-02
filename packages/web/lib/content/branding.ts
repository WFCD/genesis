import 'server-only';

import env from '@/lib/env';

export const getAppName = () => env.appName;

export const getDashboardTitle = () => `${getAppName()} Dashboard`;
