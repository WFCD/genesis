/**
 * Substituted by webpack for server-only modules if they are pulled into a client bundle.
 * Should never execute — import should fail at build time via `server-only` first.
 */
throw new Error('This module is server-only and must not be imported from client code.');

export {};
