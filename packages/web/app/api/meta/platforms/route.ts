import platformMap from '#shared/resources/platformMap.json';
import { jsonCached } from '@/lib/api/response';

export const GET = () => jsonCached({ platforms: platformMap });
