import platformMap from '#shared/resources/platformMap.json';
import { jsonCached } from '@/lib/api/response';

export async function GET() {
  return jsonCached({ platforms: platformMap });
}
