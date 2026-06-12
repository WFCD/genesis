import localeMap from '#shared/resources/localeMap.json';
import { jsonCached } from '@/lib/api/response';

export async function GET() {
  return jsonCached({ locales: localeMap });
}
