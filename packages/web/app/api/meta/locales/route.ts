import localeMap from '#shared/resources/localeMap.json';
import { jsonCached } from '@/lib/api/response';

export function GET() {
  return jsonCached({ locales: localeMap });
}
