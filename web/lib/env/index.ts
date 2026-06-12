import 'server-only';

import { applyEnvToProcess, buildEnv } from './build';
import { loadParentEnvFiles } from './loadParentEnvFiles';
import { readFromProcess } from './readFromProcess';

/**
 * Web app environment configuration.
 *
 * Local dev: `web/.env.local.local` and/or repo-root `.env.local.docker`.
 * Docker: compose `env_file: .env.local.docker` plus service overrides.
 *
 * Server-only — do not import from middleware or auth.config (use `buildEnv` there).
 */
loadParentEnvFiles();

export const env = buildEnv(readFromProcess);

applyEnvToProcess(env);

export default env;
export { applyEnvToProcess, buildEnv } from '@/lib/env/build';
export type { WebEnv } from '@/lib/env/build';
export { loadParentEnvFiles } from '@/lib/env/loadParentEnvFiles';
export { readFromProcess } from '@/lib/env/readFromProcess';
