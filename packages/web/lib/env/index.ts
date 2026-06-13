import 'server-only';

import '#shared/utilities/loadParentEnvFiles';
import { applyEnvToProcess, buildEnv } from './build';
import { readFromProcess } from './readFromProcess';

/**
 * Web app environment configuration.
 *
 * Local dev: `web/.env.local` and/or repo-root `.env.local`.
 * Docker: compose `env_file: .env.local` plus service overrides.
 *
 * Server-only — do not import from middleware or auth.config (use `buildEnv` there).
 */
export const env = buildEnv(readFromProcess);

applyEnvToProcess(env);

export default env;
export { applyEnvToProcess, buildEnv } from '@/lib/env/build';
export type { WebEnv } from '@/lib/env/build';
export { loadParentEnvFiles } from '#shared/utilities/loadParentEnvFiles';
export { readFromProcess } from '@/lib/env/readFromProcess';
