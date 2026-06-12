/** Localized slash-command name/description pairs keyed by command id. */
export type CommandLocaleEntry = {
  name: string;
  description: string;
};

export type CommandLocaleModule = Record<string, CommandLocaleEntry>;
