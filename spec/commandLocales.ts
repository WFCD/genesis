import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { DiscordLocales, LocalDiscordLocaleMappings, locales } from '#shared/resources';
import type { CommandLocaleModule } from '#shared/resources/locales/commands/types';

const commandsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../packages/shared/resources/locales/commands'
);

const resolveCommandLocaleFile = (locale: string): string | undefined => {
  for (const ext of ['.ts', '.js']) {
    const candidate = path.resolve(commandsDir, `${locale}${ext}`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
};

const resolveDiscordLocaleKey = (locale: string): string | undefined => {
  if (DiscordLocales.includes(locale)) return locale;
  const mapped = LocalDiscordLocaleMappings[locale];
  if (mapped && DiscordLocales.includes(mapped)) return mapped;
  return undefined;
};

/** Load slash-command locale bundles without importing interaction handlers. */
export async function loadCommandLocaleModules(): Promise<Record<string, CommandLocaleModule>> {
  const modules: Record<string, CommandLocaleModule> = {};

  await Promise.all(
    locales.map(async (locale) => {
      const localeKey = resolveDiscordLocaleKey(locale);
      const filePath = resolveCommandLocaleFile(locale);
      if (!localeKey || !filePath) return;

      modules[localeKey] = (await import(pathToFileURL(filePath).href)).default as CommandLocaleModule;
    })
  );

  return modules;
}

/** Keys like `settings.manage` — first-level subcommands/options in locale files. */
export function groupSubcommandLocaleKeys(module: CommandLocaleModule): Map<string, string[]> {
  const byParent = new Map<string, string[]>();

  Object.keys(module).forEach((key) => {
    const match = key.match(/^([^.]+)\.([^.]+)$/);
    if (!match) return;

    const parent = match[1];
    const siblings = byParent.get(parent) ?? [];
    siblings.push(key);
    byParent.set(parent, siblings);
  });

  return byParent;
}
