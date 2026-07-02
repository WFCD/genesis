import localeMap from '#shared/resources/localeMap.json';
import { jsonCached } from '@/lib/api/response';

export const GET = () => jsonCached({ locales: localeMap });
