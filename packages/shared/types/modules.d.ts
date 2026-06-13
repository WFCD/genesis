declare module '#shared/embeds/LogEmbed' {
  import type BaseEmbed from '#shared/embeds/BaseEmbed';

  export default class LogEmbed extends BaseEmbed {
    constructor(log: { color: number; title: string; fields: unknown[]; footer?: string });
  }
}

declare module 'decache' {
  function decache(moduleId: string): void;
  export default decache;
}

declare module 'sql-template-strings' {
  export interface SQLStatement {
    append(part: SQLStatement | string): SQLStatement;
    strings: string[];
    values: unknown[];
  }

  function SQL(strings: TemplateStringsArray, ...values: unknown[]): SQLStatement;
  export default SQL;
}
